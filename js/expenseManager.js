/**
 * Created by tonyg on 26/10/2016.
 */

//Manage expense records
class ExpenseManager {
    constructor() {
        this.expenses = [];
    }

    addExpense(expense) {
        let index = this.getExpenseFromDate(expense.date);
        if(index < 0) {
            //New expense
            this.expenses.push([]);
            index = this.expenses.length - 1;
        }
        this.expenses[index].push(expense);
    }

    getExpenseFromDate(date) {
        let currentExpense, currentDate;
        for(let i=0, numExpenses=this.expenses.length; i<numExpenses; ++i) {
            currentExpense = this.expenses[i];
            currentDate = currentExpense.getDate();
            if(currentDate.year === date.year && currentDate.month === date.month && currentDate.day === date.day) {
                return i;
            }
        }

        return -1;
    }
}

