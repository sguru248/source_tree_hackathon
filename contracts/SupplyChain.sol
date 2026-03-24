// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    enum Role { Farmer, Processor, Distributor, Retailer, Certifier }
    enum ProductStatus { Created, InTransit, Processing, Delivered, Verified, Flagged }

    struct Participant {
        string name;
        Role role;
        string location;
        bool isRegistered;
    }

    struct Project {
        uint256 id;
        string name;
        string description;
        address owner;
        uint256 createdAt;
        bool isActive;
        uint256 memberCount;
        uint256 productCount;
    }

    struct Product {
        uint256 id;
        uint256 projectId;
        string name;
        string origin;
        string batchId;
        address creator;
        uint256 createdAt;
        ProductStatus status;
        uint256 checkpointCount;
        string hcsTopicId;
        string nftTokenId;
        uint256 nftSerialNumber;
    }

    struct Checkpoint {
        uint256 id;
        uint256 productId;
        address handler;
        string locationName;
        int256 latitude;
        int256 longitude;
        ProductStatus status;
        string notes;
        uint256 timestamp;
        int256 temperature;
        uint256 hcsSequenceNumber;
    }

    // Pausable / Ownership
    address public owner;
    bool public paused;

    // Storage
    mapping(address => Participant) public participants;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Product) public products;
    mapping(uint256 => Checkpoint[]) public checkpoints;

    // Project membership
    mapping(uint256 => mapping(address => bool)) public projectMembers;
    mapping(uint256 => mapping(address => bool)) public pendingRequests;
    mapping(uint256 => address[]) public projectMemberList;
    mapping(uint256 => address[]) public pendingRequestList;
    mapping(uint256 => uint256[]) public projectProductIds;

    // Counters
    uint256 public projectCount;
    uint256 public productCount;
    uint256 public participantCount;
    uint256 public checkpointTotalCount;

    // Events
    event ParticipantRegistered(address indexed participant, string name, Role role);
    event ProjectCreated(uint256 indexed projectId, string name, address owner);
    event JoinRequested(uint256 indexed projectId, address participant);
    event JoinApproved(uint256 indexed projectId, address participant);
    event JoinRejected(uint256 indexed projectId, address participant);
    event ProductCreated(uint256 indexed productId, uint256 indexed projectId, string name, address creator);
    event CheckpointAdded(uint256 indexed productId, uint256 checkpointId, string locationName, ProductStatus status);
    event ProductVerified(uint256 indexed productId, address verifier);
    event NFTLinked(uint256 indexed productId, string nftTokenId, uint256 serialNumber);
    event ProductFlagged(uint256 indexed productId, address flagger, string reason);
    event HCSLinked(uint256 indexed productId, uint256 checkpointIndex, uint256 sequenceNumber);

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier onlyRegistered() {
        require(participants[msg.sender].isRegistered, "Not registered");
        _;
    }

    modifier onlyProjectMember(uint256 _projectId) {
        require(projectMembers[_projectId][msg.sender], "Not a project member");
        _;
    }

    modifier onlyProjectOwner(uint256 _projectId) {
        require(projects[_projectId].owner == msg.sender, "Not project owner");
        _;
    }

    // ─── Pausable ───

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    // ─── State Machine ───

    function _isValidTransition(ProductStatus _from, ProductStatus _to) internal pure returns (bool) {
        if (_from == ProductStatus.Verified || _from == ProductStatus.Flagged) return false;
        if (_to == ProductStatus.Flagged) return true;

        if (_from == ProductStatus.Created) {
            return _to == ProductStatus.InTransit || _to == ProductStatus.Processing;
        }
        if (_from == ProductStatus.InTransit) {
            return _to == ProductStatus.InTransit || _to == ProductStatus.Processing || _to == ProductStatus.Delivered;
        }
        if (_from == ProductStatus.Processing) {
            return _to == ProductStatus.InTransit || _to == ProductStatus.Delivered;
        }
        if (_from == ProductStatus.Delivered) {
            return _to == ProductStatus.Verified;
        }
        return false;
    }

    // ─── Role-Based Status Restrictions ───

    function _canSetStatus(Role _role, ProductStatus _status) internal pure returns (bool) {
        if (_role == Role.Certifier) return true;
        if (_role == Role.Farmer) return _status == ProductStatus.Created || _status == ProductStatus.InTransit;
        if (_role == Role.Processor) return _status == ProductStatus.Processing || _status == ProductStatus.InTransit;
        if (_role == Role.Distributor) return _status == ProductStatus.InTransit || _status == ProductStatus.Delivered;
        if (_role == Role.Retailer) return _status == ProductStatus.Delivered;
        return false;
    }

    // ─── Registration ───

    function registerParticipant(string memory _name, Role _role, string memory _location) external whenNotPaused {
        require(!participants[msg.sender].isRegistered, "Already registered");
        participants[msg.sender] = Participant(_name, _role, _location, true);
        participantCount++;
        emit ParticipantRegistered(msg.sender, _name, _role);
    }

    // ─── Project Management ───

    function createProject(string memory _name, string memory _description) external onlyRegistered whenNotPaused {
        Role role = participants[msg.sender].role;
        require(role == Role.Retailer || role == Role.Certifier, "Only Retailer/Certifier can create projects");

        projectCount++;
        projects[projectCount] = Project({
            id: projectCount,
            name: _name,
            description: _description,
            owner: msg.sender,
            createdAt: block.timestamp,
            isActive: true,
            memberCount: 1,
            productCount: 0
        });

        // Owner is automatically a member
        projectMembers[projectCount][msg.sender] = true;
        projectMemberList[projectCount].push(msg.sender);

        emit ProjectCreated(projectCount, _name, msg.sender);
    }

    function requestJoinProject(uint256 _projectId) external onlyRegistered whenNotPaused {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project");
        require(projects[_projectId].isActive, "Project not active");
        require(!projectMembers[_projectId][msg.sender], "Already a member");
        require(!pendingRequests[_projectId][msg.sender], "Request already pending");

        pendingRequests[_projectId][msg.sender] = true;
        pendingRequestList[_projectId].push(msg.sender);

        emit JoinRequested(_projectId, msg.sender);
    }

    function approveJoinRequest(uint256 _projectId, address _participant) external onlyProjectOwner(_projectId) whenNotPaused {
        require(pendingRequests[_projectId][_participant], "No pending request");

        pendingRequests[_projectId][_participant] = false;
        projectMembers[_projectId][_participant] = true;
        projectMemberList[_projectId].push(_participant);
        projects[_projectId].memberCount++;

        // Remove from pending list
        _removeFromPendingList(_projectId, _participant);

        emit JoinApproved(_projectId, _participant);
    }

    function rejectJoinRequest(uint256 _projectId, address _participant) external onlyProjectOwner(_projectId) whenNotPaused {
        require(pendingRequests[_projectId][_participant], "No pending request");

        pendingRequests[_projectId][_participant] = false;
        _removeFromPendingList(_projectId, _participant);

        emit JoinRejected(_projectId, _participant);
    }

    function _removeFromPendingList(uint256 _projectId, address _participant) internal {
        address[] storage list = pendingRequestList[_projectId];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == _participant) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }
    }

    // ─── Product Management ───

    function createProduct(
        uint256 _projectId,
        string memory _name,
        string memory _origin,
        string memory _batchId,
        string memory _hcsTopicId
    ) external onlyRegistered onlyProjectMember(_projectId) whenNotPaused returns (uint256) {
        productCount++;
        products[productCount] = Product({
            id: productCount,
            projectId: _projectId,
            name: _name,
            origin: _origin,
            batchId: _batchId,
            creator: msg.sender,
            createdAt: block.timestamp,
            status: ProductStatus.Created,
            checkpointCount: 0,
            hcsTopicId: _hcsTopicId,
            nftTokenId: "",
            nftSerialNumber: 0
        });

        projectProductIds[_projectId].push(productCount);
        projects[_projectId].productCount++;

        emit ProductCreated(productCount, _projectId, _name, msg.sender);
        return productCount;
    }

    function addCheckpoint(
        uint256 _productId,
        string memory _locationName,
        int256 _latitude,
        int256 _longitude,
        ProductStatus _status,
        string memory _notes,
        int256 _temperature
    ) external onlyRegistered whenNotPaused {
        require(_productId > 0 && _productId <= productCount, "Invalid product");
        Product storage product = products[_productId];
        require(projectMembers[product.projectId][msg.sender], "Not a member of this product's project");

        // GPS/temperature validation
        require(_temperature >= -10000 && _temperature <= 10000, "Temperature out of range (-100 to 100 C)");
        require(_latitude >= -90000000 && _latitude <= 90000000, "Latitude out of range");
        require(_longitude >= -180000000 && _longitude <= 180000000, "Longitude out of range");

        // State machine validation
        require(_isValidTransition(product.status, _status), "Invalid status transition");

        // Role-based restrictions
        Role callerRole = participants[msg.sender].role;
        require(_canSetStatus(callerRole, _status), "Your role cannot set this status");

        checkpointTotalCount++;
        uint256 cpId = checkpointTotalCount;

        checkpoints[_productId].push(Checkpoint({
            id: cpId,
            productId: _productId,
            handler: msg.sender,
            locationName: _locationName,
            latitude: _latitude,
            longitude: _longitude,
            status: _status,
            notes: _notes,
            timestamp: block.timestamp,
            temperature: _temperature,
            hcsSequenceNumber: 0
        }));

        product.checkpointCount++;
        product.status = _status;

        emit CheckpointAdded(_productId, cpId, _locationName, _status);
    }

    function verifyProduct(uint256 _productId) external onlyRegistered whenNotPaused {
        require(_productId > 0 && _productId <= productCount, "Invalid product");
        Product storage product = products[_productId];
        require(
            projects[product.projectId].owner == msg.sender,
            "Only project owner can verify"
        );
        require(product.status == ProductStatus.Delivered, "Product must be Delivered to verify");
        product.status = ProductStatus.Verified;
        emit ProductVerified(_productId, msg.sender);
    }

    function flagProduct(uint256 _productId, string memory _reason) external onlyRegistered whenNotPaused {
        require(_productId > 0 && _productId <= productCount, "Invalid product");
        Product storage product = products[_productId];
        require(projectMembers[product.projectId][msg.sender], "Not a member of this product's project");
        require(product.status != ProductStatus.Verified && product.status != ProductStatus.Flagged, "Cannot flag terminal status");
        product.status = ProductStatus.Flagged;
        emit ProductFlagged(_productId, msg.sender, _reason);
    }

    function linkNFT(uint256 _productId, string memory _nftTokenId, uint256 _serialNumber) external onlyRegistered whenNotPaused {
        require(_productId > 0 && _productId <= productCount, "Invalid product");
        Product storage product = products[_productId];
        require(product.status == ProductStatus.Verified, "Product must be Verified to link NFT");
        require(projects[product.projectId].owner == msg.sender, "Only project owner can link NFT");
        product.nftTokenId = _nftTokenId;
        product.nftSerialNumber = _serialNumber;
        emit NFTLinked(_productId, _nftTokenId, _serialNumber);
    }

    // ─── HCS Cross-Reference ───

    function linkHCSSequence(uint256 _productId, uint256 _checkpointIndex, uint256 _sequenceNumber) external onlyRegistered whenNotPaused {
        require(_productId > 0 && _productId <= productCount, "Invalid product");
        Product storage product = products[_productId];
        require(projectMembers[product.projectId][msg.sender], "Not a member of this product's project");
        require(_checkpointIndex < checkpoints[_productId].length, "Invalid checkpoint index");
        checkpoints[_productId][_checkpointIndex].hcsSequenceNumber = _sequenceNumber;
        emit HCSLinked(_productId, _checkpointIndex, _sequenceNumber);
    }

    // ─── View Functions ───

    function getProject(uint256 _projectId) external view returns (Project memory) {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project");
        return projects[_projectId];
    }

    function getProjectMembers(uint256 _projectId) external view returns (address[] memory) {
        return projectMemberList[_projectId];
    }

    function getPendingRequests(uint256 _projectId) external view returns (address[] memory) {
        return pendingRequestList[_projectId];
    }

    function getProjectProducts(uint256 _projectId) external view returns (uint256[] memory) {
        return projectProductIds[_projectId];
    }

    function isProjectMember(uint256 _projectId, address _addr) external view returns (bool) {
        return projectMembers[_projectId][_addr];
    }

    function isPendingRequest(uint256 _projectId, address _addr) external view returns (bool) {
        return pendingRequests[_projectId][_addr];
    }

    function getProduct(uint256 _productId) external view returns (Product memory) {
        require(_productId > 0 && _productId <= productCount, "Invalid product");
        return products[_productId];
    }

    function getCheckpoints(uint256 _productId) external view returns (Checkpoint[] memory) {
        require(_productId > 0 && _productId <= productCount, "Invalid product");
        return checkpoints[_productId];
    }

    function getCheckpointCount(uint256 _productId) external view returns (uint256) {
        return checkpoints[_productId].length;
    }

    function getStats() external view returns (uint256, uint256, uint256) {
        return (productCount, participantCount, checkpointTotalCount);
    }
}
