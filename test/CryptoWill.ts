import { calculateGas, getBalance } from '../test/utils';

const { time, expectRevert } = require('@openzeppelin/test-helpers');

const CryptoWill = artifacts.require('CryptoWill');

contract('CryptoWill', accounts => {
    const [owner, beneficiary, attacker] = accounts;

    it('should make initial deposit with owner and beneficiary', async () => {
        // GIVEN
        const initialDeposit = web3.utils.toWei('1', 'ether');
        const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
            from: owner,
            value: initialDeposit,
        });

        // WHEN
        const ownerAddress = await instance.owner();
        const beneficiaryAddress = await instance.beneficiary();
        const amount = await instance.amount();

        // THEN
        expect(ownerAddress).to.equal(owner);
        expect(beneficiaryAddress).to.equal(beneficiary);
        expect(amount.toString()).to.equal(initialDeposit);
    });

    context('withdrawals', async () => {
        it('should allow owner to withdraw partial amount', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });
            const balance = await getBalance(owner);

            //WHEN
            const withdrawalAmount = web3.utils.toWei('0.5', 'ether');
            const {
                receipt: { status, gasUsed },
                tx,
            } = await instance.withdraw(withdrawalAmount, { from: owner });
            const currentBalance = await getBalance(owner);
            const { gasPrice } = await web3.eth.getTransaction(tx);

            // THEN
            expect(status).to.be.true;
            expect(
                web3.utils.toWei(currentBalance.add(calculateGas(gasPrice, gasUsed)).sub(balance), 'wei').toString(),
            ).to.equal(withdrawalAmount);
        });

        it('should decrease stored amount on withdrawal', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });

            //WHEN
            const withdrawalAmount = web3.utils.toWei('0.6', 'ether');
            await instance.withdraw(withdrawalAmount, { from: owner });

            // THEN
            const amount = await instance.amount();
            expect(amount.toString()).to.equal(web3.utils.toWei('0.4', 'ether'));
        });

        it('should allow owner to withdraw full amount', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });
            const balance = await getBalance(owner);

            //WHEN
            const withdrawalAmount = web3.utils.toWei('1', 'ether');
            const {
                receipt: { status, gasUsed },
                tx,
            } = await instance.withdraw(withdrawalAmount, { from: owner });
            const currentBalance = await getBalance(owner);
            const { gasPrice } = await web3.eth.getTransaction(tx);

            // THEN
            expect(status).to.be.true;
            expect(
                web3.utils.toWei(currentBalance.add(calculateGas(gasPrice, gasUsed)).sub(balance), 'wei').toString(),
            ).to.equal(withdrawalAmount);
        });

        it('should allow owner to withdraw full amount when interval has passed', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });
            const balance = await getBalance(owner);

            //WHEN
            await time.increase(time.duration.days(1));
            const withdrawalAmount = web3.utils.toWei('1', 'ether');
            const {
                receipt: { status, gasUsed },
                tx,
            } = await instance.withdraw(withdrawalAmount, { from: owner });
            const currentBalance = await getBalance(owner);
            const { gasPrice } = await web3.eth.getTransaction(tx);

            // THEN
            expect(status).to.be.true;
            expect(
                web3.utils.toWei(currentBalance.add(calculateGas(gasPrice, gasUsed)).sub(balance), 'wei').toString(),
            ).to.equal(withdrawalAmount);
        });

        it('should not allow beneficiary to withdraw', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });

            //WHEN
            await expectRevert(
                instance.withdraw(web3.utils.toWei('1', 'ether'), { from: beneficiary }),
                'only owner has access',
            );
        });

        it('should not allow attacker to withdraw', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });

            //WHEN
            await expectRevert(
                instance.withdraw(web3.utils.toWei('1', 'ether'), { from: attacker }),
                'only owner has access',
            );
        });
    });

    context('claims', async () => {
        it('should decline claim by beneficiary if interval has not passed', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });

            //WHEN
            await expectRevert(instance.claim({ from: beneficiary }), 'interval has not passed yet');
        });

        it('should allow claim by beneficiary if interval has passed', async () => {
            // GIVEN
            const initialDeposit = web3.utils.toWei('1', 'ether');
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: initialDeposit,
            });
            const beneficiaryBalance = await getBalance(beneficiary);

            //WHEN
            await time.increase(time.duration.days(1));
            const {
                receipt: { status, gasUsed },
                tx,
            } = await instance.claim({ from: beneficiary });
            const currentBeneficiaryBalance = await getBalance(beneficiary);
            const { gasPrice } = await web3.eth.getTransaction(tx);

            // THEN
            expect(status).to.be.true;
            expect(
                web3.utils
                    .toWei(
                        currentBeneficiaryBalance.add(calculateGas(gasPrice, gasUsed)).sub(beneficiaryBalance),
                        'wei',
                    )
                    .toString(),
            ).to.equal(initialDeposit);
        });

        it('should decline claim by attacker if interval has not passed', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });

            //WHEN
            await expectRevert(instance.claim({ from: attacker }), 'only beneficiary has access');
        });

        it('should decline claim by attacker if interval has passed', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });

            //WHEN
            await time.increase(time.duration.days(1));

            // THEN
            await expectRevert(instance.claim({ from: attacker }), 'only beneficiary has access');
        });
    });

    context('check ins', async () => {
        it('should extend interval when owner checks in', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });

            //WHEN
            const currentTime = await time.latest();
            await time.increaseTo(currentTime.add(time.duration.hours(12)));
            await instance.checkIn({ from: owner });
            await time.increaseTo(currentTime.add(time.duration.days(1)));

            // THEN
            await expectRevert(instance.claim({ from: beneficiary }), 'interval has not passed yet');
        });

        it('should allow claim by beneficiary after extended interval has passed', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });

            //WHEN
            const currentTime = await time.latest();
            await time.increaseTo(currentTime.add(time.duration.hours(12)));
            await instance.checkIn({ from: owner });
            await time.increase(time.duration.days(1));
            const {
                receipt: { status },
            } = await instance.claim({ from: beneficiary });

            // THEN
            expect(status).to.be.true;
        });

        it('should not allow attacker to check in', async () => {
            // GIVEN
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: web3.utils.toWei('1', 'ether'),
            });

            //WHEN
            await expectRevert(instance.checkIn({ from: attacker }), 'only owner has access');
        });
    });

    context('deposits', async () => {
        it('should allow deposit by owner', async () => {
            // GIVEN
            const initialDeposit = web3.utils.toWei('1', 'ether');
            const instance = await CryptoWill.new(beneficiary, time.duration.days(1), {
                from: owner,
                value: initialDeposit,
            });

            // WHEN
            const {
                receipt: { status },
            } = await instance.deposit({ from: owner, value: web3.utils.toWei('1', 'ether') });

            // THEN
            const newAmount = await instance.amount();
            expect(status).to.be.true;
            expect(newAmount.toString()).to.equal(web3.utils.toWei('2', 'ether'));
        });
    });
});
