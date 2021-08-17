pragma solidity >=0.4.22 <0.9.0;

contract Greeter {
    string private name;

    function setName(string memory _name) public {
        name = _name;
    }

    function getGreeting() public view returns (string memory) {
        return string(abi.encodePacked("Hello, ", name, "!"));
    }
}
