class Money {
  constructor(amount, currency) {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }
    this.amount = amount;
    this.currency = currency;
  }

  add(other) {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor) {
    return new Money(this.amount * factor, this.currency);
  }
}

module.exports = Money;