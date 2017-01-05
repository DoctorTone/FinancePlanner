/**
 * Created by tonyg on 25/10/2016.
 */
//Financial records

var Expense = function(date, amount, item, tags) {
    this.total = amount;
    this.day = date.day;
    this.month = date.month;
    this.year = date.year;
    this.prices = [];
    this.prices.push(amount);
    this.priceInfo = [];
    var info = { item: item,
                tags: tags};
    this.priceInfo.push(info);
};

Expense.prototype = {
    update: function(amount, item, tags) {
        this.prices.push(amount);
        this.total += amount;
        var info = { item: item,
            tags: tags};
        this.priceInfo.push(info);
    },

    getTotal: function() {
        return this.total;
    }
};
