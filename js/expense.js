/**
 * Created by tonyg on 25/10/2016.
 */
//Financial records

var Expense = function(date, expenseInfo) {
    this.total = 0;
    this.day = date.day;
    this.month = date.month;
    this.year = date.year;
    this.prices = [];
    this.priceInfo = [];
    this.addItem(expenseInfo);
};

Expense.prototype = {
    addItem: function(expenseInfo) {
        this.prices.push(expenseInfo.amount);
        this.total += expenseInfo.amount;
        var info = { item: expenseInfo.item,
                    tags: expenseInfo.tags};
        this.priceInfo.push(info);
    },

    updateItem: function(amount, item, tags, itemIndex) {
        //Amend total
        this.total -= this.prices[itemIndex];
        this.prices[itemIndex] = amount;
        this.total += amount;
        this.priceInfo[itemIndex].item = item;
        this.priceInfo[itemIndex].tags = tags;
    },

    getTotal: function() {
        return this.total;
    }
};
