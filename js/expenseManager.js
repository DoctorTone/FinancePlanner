/**
 * Created by tonyg on 26/10/2016.
 */

//Manage expense records
class ExpenseManager {
    constructor() {
        this.expenses = [];
    }

    addExpense(expense) {
        let index = this.getExpenseIndexFromDate(expense.date);
        if(index < 0) {
            //New expense
            this.expenses.push([]);
            index = this.expenses.length - 1;
        }
        this.expenses[index].push(expense);
    }

    getExpenseIndexFromDate(date) {
        let currentExpense, currentDate;
        for(let i=0, numExpenses=this.expenses.length; i<numExpenses; ++i) {
            currentExpense = this.expenses[i];
            currentDate = currentExpense[0].getDate();
            if(currentDate.year === date.year && currentDate.month === date.month && currentDate.day === date.day) {
                return i;
            }
        }

        return -1;
    }

    getExpenses(date) {
        //Get all expenses on this date
        let index = this.getExpenseIndexFromDate(date);
        if(index >= 0) {
            return this.expenses[index];
        }

        return undefined;
    }

    getExpense(date, index) {
        let expense = this.getExpenses(date);
        if(expense) {
            return expense[index];
        }

        return undefined;
    }

    updateExpense(expense, index) {
        let expenses = this.getExpenses(expense.date);
        if(expenses) {
            expenses[index] = expense;
        }
    }

    deleteExpense(date, index) {
        let expenses = this.getExpenses(date);
        if(expenses) {
            expenses.splice(index, 1);
        }
    }

    getDailyTotal(date) {
        //Get amount for this date
        let total = 0;
        let index = this.getExpenseIndexFromDate(date);
        if(index >= 0) {
            let currentExpense = this.expenses[index];
            for(let i=0, numItems=currentExpense.length; i<numItems; ++i) {
                total += currentExpense[i].getTotal();
            }
        }

        return total;
    }

    getAllExpensesJSON() {
        //Convert array to JSON
        return JSON.stringify(this.expenses);
    }

    loadExpenses(expenses) {
        this.expenses.length = 0;
        let currentExpense, expenseInfo;
        for(let i=0, numDays=expenses.length; i<numDays; ++i) {
            currentExpense = expenses[i];
            this.expenses.push([]);
            for(let j=0, numExpenses=currentExpense.length; j<numExpenses; ++j) {
                expenseInfo = {};
                expenseInfo.amount = currentExpense[j].price;
                expenseInfo.item = currentExpense[j].priceInfo.item;
                expenseInfo.tags = currentExpense[j].priceInfo.tags;
                this.expenses[i].push(new Expense(currentExpense[j].date, expenseInfo));
            }
        }
    }
}

