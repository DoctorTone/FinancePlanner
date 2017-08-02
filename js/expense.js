/**
 * Created by tonyg on 25/10/2016.
 */
//Financial records

class Expense {
    constructor(date, expenseInfo) {
        this.price = expenseInfo.amount;
        this.date = {
            day: date.day,
            month: date.month,
            year: date.year
        };
        this.priceInfo = {
            item: expenseInfo.item,
            tags: expenseInfo.tags
        };
    }

    updateItem(amount, item, tags) {
        //Amend total
        this.price = amount;
        this.priceInfo.item = item;
        this.priceInfo.tags = tags;
    }

    getTotal() {
        return this.price;
    }
}
