import { GreeterInstance } from 'truffle-contracts';

const Greeter = artifacts.require('Greeter');

contract('Greeter', accounts => {
    const [account] = accounts;

    let instance: GreeterInstance;
    beforeEach(async () => {
        instance = await Greeter.new();
    });

    it('should set name', async () => {
        const {
            receipt: { status },
        } = await instance.setName('John', { from: account });
        expect(status).to.be.true;
    });

    it('should return name in greeting', async () => {
        await instance.setName('John', { from: account });
        const greeting = await instance.getGreeting({ from: account });
        expect(greeting).to.equal('Hello, John!');
    });
});
