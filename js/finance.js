/**
 * Created by DrTone on 04/12/2014.
 */
//Visualisation framework
let NUM_DAYS = 7;
let FLOOR_WIDTH = 800;
let FLOOR_HEIGHT = 600;
let SEGMENTS = 8;
let NODE_RADIUS = 5;
let NODE_SEGMENTS = 24;
let EXPENSE_NOTHING = 0;
let EXPENSE_ADD = 1;
let EXPENSE_EDIT = 2;

//Init this app from base
class Finance extends BaseApp {
    constructor() {
        super();

        //Current item
        this.currentAmount = 0;
        this.currentItem = undefined;
        this.currentTags = [];
        this.expenseIndex = -1;
        this.expenseState = EXPENSE_NOTHING;

        //Date info
        this.currentDate = {};
        this.currentDate.day = 0;
        this.currentDate.month = 9;
        this.currentDate.year = 2016;
    }

    init(container) {
        super.init(container);

        //Expenses
        this.expenseManager = new ExpenseManager();
    }

    createScene() {
        //Create scene
        super.createScene();

        //Floor
        let planeGeom = new THREE.PlaneBufferGeometry(FLOOR_WIDTH, FLOOR_HEIGHT, SEGMENTS, SEGMENTS);
        let planeMat = new THREE.MeshLambertMaterial( {color: 0x444444});
        let plane = new THREE.Mesh(planeGeom, planeMat);
        plane.rotation.x = -Math.PI/2;
        this.addToScene(plane);

        //Create weeks worth of data
        let label;
        let pos = new THREE.Vector3(0, 50, -50);
        let monthScale = new THREE.Vector3(80, 60, 1);
        let dayLabelOffset = new THREE.Vector3(0, -15, 10);
        let expendLabelOffset = new THREE.Vector3(0, 2, 0);
        let sphereGeom = new THREE.SphereBufferGeometry(NODE_RADIUS, NODE_SEGMENTS, NODE_SEGMENTS);
        this.sphereMat = new THREE.MeshPhongMaterial({color: 0xfed600});
        this.sphereMatSelected = new THREE.MeshPhongMaterial( {color: 0xffffff, emissive: 0xfed600} );
        let i, xStart=-100, xInc=35, yStart=10, zStart=0;
        let node;
        this.nodes = [];
        label = spriteManager.create("October 2016", pos, monthScale, 32, 1, true, false);
        this.addToScene(label);

        let dayScale = new THREE.Vector3(30, 30, 1);
        for(i=0; i<NUM_DAYS; ++i) {
            node = new THREE.Mesh(sphereGeom, i===this.currentDate.day ? this.sphereMatSelected : this.sphereMat);
            node.position.set(xStart+(xInc*i), yStart, zStart);
            this.nodes.push(node);
            this.addToScene(node);
            pos.copy(node.position);
            pos.add(dayLabelOffset);
            label = spriteManager.create(DATES.DayNumbers[i], pos, dayScale, 32, 1, true, false);
            this.addToScene(label);
            pos.copy(node.position);
            pos.add(expendLabelOffset);
            label = spriteManager.create("£0.00", pos, dayScale, 32, 1, true, false);
            this.addToScene(label);
        }
        this.groundOffset = yStart;
        this.labelOffset = expendLabelOffset.y;
    }

    update() {
        super.update();
    }

    nextDay() {
        if(this.expenseState !== EXPENSE_NOTHING) return;

        if(++this.currentDate.day > 30) {
            this.currentDate.day = 0;
        }

        let day = this.currentDate.day;
        this.nodes[day].material = this.sphereMatSelected;
        this.nodes[day].material.needsUpdate = true;
        this.nodes[day-1].material = this.sphereMat;
        this.nodes[day-1].material.needsUpdate = true;
        $('#day').html(DATES.DayNumbers[day]);

        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateExpenditure(total);
    }

    previousDay() {
        if(this.expenseState !== EXPENSE_NOTHING) return;

        if(--this.currentDate.day < 0) {
            this.currentDate.day = 30;
        }

        let day = this.currentDate.day;
        this.nodes[day].material = this.sphereMatSelected;
        this.nodes[day].material.needsUpdate = true;
        this.nodes[day+1].material = this.sphereMat;
        this.nodes[day+1].material.needsUpdate = true;
        $('#day').html(DATES.DayNumbers[day]);

        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateExpenditure(total);
    }

    updateExpenditure(total) {
        $('#expenditure').html(total.toFixed(2));
    }

    addExpense() {
        this.expenseState = EXPENSE_ADD;
        $('#addFormContainer').show();
    }

    cancelExpense() {
        //Clear inputs for next time
        this.clearAddForm();

        $('#addFormContainer').hide();
        if(this.expenseState !== EXPENSE_EDIT) {
            this.expenseState = EXPENSE_NOTHING;
        }
    }

    clearAddForm() {
        $('#amount').val("");
        $('#item').val("");
        $('#tags').val("");
    }

    addExpenseItem() {
        let state = this.expenseState;
        let expenseInfo = {};
        expenseInfo.amount = this.currentAmount;
        expenseInfo.item = this.currentItem;
        expenseInfo.tags = this.currentTags;

        let expense = new Expense(this.currentDate, expenseInfo);

        state === EXPENSE_EDIT ? this.expenseManager.updateExpense(expense, this.expenseIndex) :
            this.expenseManager.addExpense(expense);

        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateCurrentNode(total);
        this.updateExpenditure(total);
        this.clearAddForm();
        if(state === EXPENSE_EDIT) {
            //Update expenses
            $('#expenseTableContainer').hide();
            this.showExpense();
        } else {
            this.expenseState = EXPENSE_NOTHING;
        }
    }

    showExpense() {
        //Show item values to edit
        let expenses = this.expenseManager.getExpenses(this.currentDate);
        if(!expenses) {
            alert("No expenses for that day!");
            return;
        }
        this.expenseState = EXPENSE_EDIT;
        let table = document.getElementById("expenseTable");
        //Delete existing data
        let i, numRows = table.rows.length-1;
        for(i=numRows; i>=1; --i) {
            table.deleteRow(i);
        }
        let numItems = expenses.length-1;
        let row, info;
        for(i=0; i<=numItems; ++i) {
            info = expenses[i].priceInfo;
            row = table.insertRow(i+1);
            $(row).addClass("selectable");
            row.insertCell(0).innerHTML = (i+1).toString();
            row.insertCell(1).innerHTML = expenses[i].price.toFixed(2);
            row.insertCell(2).innerHTML = info.item;
            row.insertCell(3).innerHTML = info.tags;
        }

        //Need pointer to table
        let _this = this;
        $('.selectable').on("click", function() {
            $(this).addClass('selected').siblings().removeClass('selected');
            let value=$(this).find('td:first').html();
            //DEBUG
            console.log("Selected = ", value);
            _this.expenseIndex = value-1;
        });

        $('#expenseTableContainer').show();
    }

    dismissExpense() {
        $('#expenseTableContainer').hide();
        this.expenseState = EXPENSE_NOTHING;
    }

    validateExpense() {
        let form = document.forms["addExpenseForm"];
        let amount = form["amount"].value;
        let item = form["item"].value;
        let tags = form["tags"].value;
        let amountElem = $('#inputAmount');
        let errorElem = $('#errorText');

        if(isNaN(amount)) {
            console.log("Invalid number");
            amountElem.addClass("has-error");
            errorElem.html("Invalid number!");
        } else {
            if(amount <= 0) {
                console.log("Invalid number");
                amountElem.addClass("has-error");
                errorElem.html("Invalid number!");
            } else {
                amountElem.removeClass("has-error");
                errorElem.html("No item text!");
                errorElem.hide();
                amount = parseFloat(amount);
                //Ensure text is valid as well
                if(item !== "") {
                    $('#addFormContainer').hide();
                    this.currentAmount = amount;
                    this.currentItem = item;
                    this.currentTags = tags;
                    return true;
                }
            }
        }

        errorElem.show();
        return false;
    }

    editItem() {
        if(this.expenseIndex < 0) {
            alert("Please select an item");
            return;
        }
        this.expenseState = EXPENSE_EDIT;
        this.populateAddForm();
        $('#addFormContainer').show();
    }

    deleteItem() {
        if(this.expenseIndex < 0) {
            alert("Please select an item");
            return;
        }
        this.expenseManager.deleteExpense(this.currentDate, this.expenseIndex);
        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateCurrentNode(total);
        this.updateExpenditure(total);
        $('#expenseTableContainer').hide();
        this.showExpense();
    }

    populateAddForm() {
        $('#addFormTitle').html("Edit expense");
        let expense = this.expenseManager.getExpense(this.currentDate, this.expenseIndex);
        if(!expense) {
            console.log("No expense for that date");
            return;
        }
        $('#amount').val(expense.price);
        $('#item').val(expense.priceInfo.item);
        $('#tags').val(expense.priceInfo.tags);
    }

    updateCurrentNode(total) {
        let day = this.currentDate.day;
        let label = spriteManager.getSpriteByIndex((day*2)+2);
        label.position.y = this.groundOffset + this.labelOffset + total;
        spriteManager.setTextAmount(label, total);
        this.nodes[day].position.y = this.groundOffset + total;
    }
}

$(document).ready(function() {
    //Initialise app
    let container = document.getElementById("WebGL-output");
    let app = new Finance();
    app.init(container);
    app.createScene();
    //app.createGUI();

    //GUI callbacks
    $('#right').on("click", () => {
       app.nextDay();
    });

    $('#left').on("click", () => {
        app.previousDay();
    });

    $('#addExpense').on("click", () => {
        app.addExpense();
    });

    $('#cancelAdd').on("click", () => {
        app.cancelExpense();
    });

    $('#addExpenseForm').submit(event => {
        event.preventDefault();
        if(app.validateExpense()) {
            $('#addFormTitle').html("Add Expense");
            app.addExpenseItem();
        }
    });

    $('#editExpense').on("click", () => {
        app.showExpense();
    });

    $('#dismiss').on("click", () => {
        app.dismissExpense();
    });

    $('#editItem').on("click", () => {
        app.editItem();
    });

    $('#deleteItem').on("click", () => {
        app.deleteItem();
    });

    $('#OK').on("click", () => {
        app.dismissExpense();
    });

    app.run();
});