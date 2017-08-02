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
let EXPENSE_ADD = 0;
let EXPENSE_EDIT = 1;

//Init this app from base
class Finance extends BaseApp {
    constructor() {
        super();
    }

    init(container) {
        super.init(container);

        //Current item
        this.currentAmount = 0;
        this.currentItem = undefined;
        this.currentTags = [];
        this.expenseIndex = undefined;
        this.expenseState = EXPENSE_ADD;

        //Date info
        this.currentDate = {};
        this.currentDate.day = 0;
        this.currentDate.month = 9;
        this.currentDate.year = 2016;

        //Expenses
        this.expenseManager = new ExpenseManager();
    }

    createScene() {
        //Create scene
        super.createScene();

        //Floor
        var planeGeom = new THREE.PlaneBufferGeometry(FLOOR_WIDTH, FLOOR_HEIGHT, SEGMENTS, SEGMENTS);
        var planeMat = new THREE.MeshLambertMaterial( {color: 0x444444});
        var plane = new THREE.Mesh(planeGeom, planeMat);
        plane.rotation.x = -Math.PI/2;
        this.addToScene(plane);

        //Create weeks worth of data
        var label;
        var pos = new THREE.Vector3(0, 50, -50);
        var monthScale = new THREE.Vector3(80, 60, 1);
        var dayLabelOffset = new THREE.Vector3(0, -15, 10);
        var expendLabelOffset = new THREE.Vector3(0, 2, 0);
        var sphereGeom = new THREE.SphereBufferGeometry(NODE_RADIUS, NODE_SEGMENTS, NODE_SEGMENTS);
        this.sphereMat = new THREE.MeshPhongMaterial({color: 0xfed600});
        this.sphereMatSelected = new THREE.MeshPhongMaterial( {color: 0xffffff, emissive: 0xfed600} );
        var i, xStart=-100, xInc=35, yStart=10, zStart=0;
        var node;
        this.nodes = [];
        label = spriteManager.create("October 2016", pos, monthScale, 32, 1, true, false);
        this.addToScene(label);

        var dayScale = new THREE.Vector3(30, 30, 1);
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
        $('#addForm').show();
    }

    cancelExpense() {
        //Clear inputs for next time
        this.clearAddForm();

        $('#addForm').hide();
    }

    clearAddForm() {
        $('#amount').val("");
        $('#item').val("");
        $('#tags').val("");
    }

    addExpenseItem() {
        let expenseInfo = {};
        expenseInfo.amount = this.currentAmount;
        expenseInfo.item = this.currentItem;
        expenseInfo.tags = this.currentTags;

        let expense = new Expense(this.currentDate, expenseInfo);
        this.expenseManager.addExpense(expense);
        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateCurrentNode(total);
        this.updateExpenditure(total);
        this.clearAddForm();
    }

    showExpense() {
        //Show item values to edit
        let expense = this.expenseManager.getExpense(this.currentDate);
        let table = document.getElementById("expenseTable");
        //Delete existing data
        let i, numRows = table.rows.length-1;
        for(i=numRows; i>=1; --i) {
            table.deleteRow(i);
        }
        let numItems = expense.priceInfo.length-1;
        let row, info;
        for(i=0; i<=numItems; ++i) {
            info = expense.priceInfo[i];
            row = table.insertRow(i+1);
            $(row).addClass("selectable");
            row.insertCell(0).innerHTML = (i+1).toString();
            row.insertCell(1).innerHTML = expense.prices[i];
            row.insertCell(2).innerHTML = info.item;
            row.insertCell(3).innerHTML = info.tags;
        }

        let _this = this;
        $('.selectable').on("click", function() {
            $(this).addClass('selected').siblings().removeClass('selected');
            let value=$(this).find('td:first').html();
            //DEBUG
            console.log("Selected = ", value);
            _this.expenseIndex = value-1;
        });

        $('#viewForm').show();
    }

    dismissExpense() {
        $('#viewForm').hide();
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
                    $('#addForm').hide();
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
        this.expenseState = EXPENSE_EDIT;
        this.populateAddForm();
        $('#addForm').show();
    }

    populateAddForm() {
        var expense = this.expenseManager.getExpense(this.currentDate);
        if(!expense) {
            console.log("No expense for that data");
            return;
        }
        $('#amount').val(expense.prices[this.expenseIndex]);
        $('#item').val(expense.priceInfo[this.expenseIndex].item);
        $('#tags').val(expense.priceInfo[this.expenseIndex].tags);
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
    var container = document.getElementById("WebGL-output");
    var app = new Finance();
    app.init(container);
    app.createScene();
    //app.createGUI();

    //GUI callbacks
    $('#right').on("click", function(event) {
       app.nextDay();
    });
    $('#left').on("click", function(event) {
        app.previousDay();
    });

    $('#addExpense').on("click", function() {
        app.addExpense();
    });

    $('#cancelAdd').on("click", function() {
        app.cancelExpense();
    });

    $('#addExpenseForm').submit(function(event) {
        event.preventDefault();
        if(app.validateExpense()) {
            app.addExpenseItem();
        }
    });

    $('#editExpense').on("click", function(event) {
        app.showExpense();
    });

    $('#dismiss').on("click", function(event) {
        app.dismissExpense();
    });

    $('#editItem').on("click", function() {
        app.editItem();
    });

    $('#finish').on("click", function() {
        app.dismissExpense();
    });

    app.run();
});