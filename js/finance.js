/**
 * Created by DrTone on 04/12/2014.
 */
//Visualisation framework
let FLOOR_WIDTH = 800;
let FLOOR_HEIGHT = 600;
let SEGMENTS = 8;
let NODE_RADIUS = 5;
let NODE_SEGMENTS = 24;
let EXPENSE_NOTHING = 0;
let EXPENSE_ADD = 1;
let EXPENSE_EDIT = 2;
const PREVIOUS = 1, NEXT = -1;
let DATE_LABEL = {
    X_OFFSET: 0,
    Y_OFFSET: -15,
    Z_OFFSET: 10
};
let EXPEND_LABEL = {
    X_OFFSET: 0,
    Y_OFFSET: 0,
    Z_OFFSET: 0
};
const START_POS_X = -105;
const X_INC = 35;
const START_POS_Y = 10;
const START_POS_Z = 0;
const STAND_RADIUS = 1;
const STAND_HEIGHT = 1;
const STAND_SCALE = 4;
const BASE_OFFSET = 6;
const START_WEEK_OFFSET = 7;
const WEEK_OFFSET = 7;

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
        this.currentDate.week = 0;
        this.currentDate.month = 9;
        this.currentDate.year = 2016;
        this.daysThisMonth = DATES.daysPerMonth[this.currentDate.month];

        //Animation
        this.moveTime = 0;
        this.sceneMoving = false;
        this.SCENE_MOVE_TIME = 2;
    }

    init(container) {
        super.init(container);

        //Data loading
        this.dataLoader = new DataJSONLoader();

        //Expenses
        this.expenseManager = new ExpenseManager();
    }

    createScene() {
        //Create scene
        super.createScene();

        //Get hexagon
        let loader = new THREE.JSONLoader();
        loader.load("models/hexagon.json", (geometry, materials) => {
            //this.hexMesh = new THREE.Mesh(geometry, materials);
            this.expenseGeom = geometry;

            this.generateRepresentations();
            //Initialise offsets
            this.weeklyGap = this.nodes[10].position.x - this.nodes[3].position.x;
            this.currentDate.position = this.nodes[3].position.x;
            this.groundOffset = START_POS_Y;
            this.labelOffset = EXPEND_LABEL.Y_OFFSET;
        });

        //Floor
        this.addFloor();
    }

    addFloor() {
        let planeGeom = new THREE.PlaneBufferGeometry(FLOOR_WIDTH, FLOOR_HEIGHT, SEGMENTS, SEGMENTS);
        let planeMat = new THREE.MeshLambertMaterial( {color: 0x444444});
        let plane = new THREE.Mesh(planeGeom, planeMat);
        plane.rotation.x = -Math.PI/2;
        this.addToScene(plane);
    }

    generateRepresentations() {
        //Create representations for each day
        let label;
        let pos = new THREE.Vector3();
        let dayLabelOffset = new THREE.Vector3(DATE_LABEL.X_OFFSET, DATE_LABEL.Y_OFFSET, DATE_LABEL.Z_OFFSET);
        let expendLabelOffset = new THREE.Vector3(EXPEND_LABEL.X_OFFSET, EXPEND_LABEL.Y_OFFSET, EXPEND_LABEL.Z_OFFSET);
        this.expenseMat = new THREE.MeshPhongMaterial({color: 0xfed600});
        this.expenseMatSelected = new THREE.MeshPhongMaterial( {color: 0xffffff, emissive: 0xfed600} );
        let standGeom = new THREE.CylinderBufferGeometry(STAND_RADIUS, STAND_RADIUS, STAND_HEIGHT);
        let i, node, stand;
        this.nodes = [];
        this.dayLabels = [];
        this.spendLabels = [];
        this.stands = [];

        let dayScale = new THREE.Vector3(30, 30, 1);
        let dayGroup = new THREE.Object3D();
        dayGroup.name = "dayGroup";
        for(i=0; i<this.daysThisMonth; ++i) {
            node = new THREE.Mesh(this.expenseGeom, i===this.currentDate.day ? this.expenseMatSelected : this.expenseMat);
            node.visible = false;
            node.position.set(START_POS_X+(X_INC*i), START_POS_Y, START_POS_Z);
            this.nodes.push(node);
            dayGroup.add(node);
            pos.copy(node.position);
            pos.add(dayLabelOffset);
            label = spriteManager.create(DATES.dayNumbers[i], pos, dayScale, 32, 1, true, false);
            label.visible = false;
            dayGroup.add(label);
            this.dayLabels.push(label);
            pos.copy(node.position);
            pos.add(expendLabelOffset);
            label = spriteManager.create("£0.00", pos, dayScale, 32, 1, true, false);
            label.visible = false;
            this.spendLabels.push(label);
            //Add stand for representation as well
            stand = new THREE.Mesh(standGeom, i===this.currentDate.day ? this.expenseMatSelected : this.expenseMat);
            stand.visible = false;
            stand.scale.y = STAND_SCALE;
            stand.position.set(START_POS_X+(X_INC*i), STAND_SCALE/2, START_POS_Z);
            this.stands.push(stand);
            dayGroup.add(stand);
            dayGroup.add(label);
        }
        this.addToScene(dayGroup);
        this.dayGroup = dayGroup;
        //Show first week
        this.setWeekStatus(this.currentDate.week, true);
    }

    update() {
        super.update();

        let delta = this.clock.getDelta();
        this.elapsedTime += delta;

        if(this.sceneMoving) {
            this.moveTime += delta;
            this.dayGroup.position.x += (this.moveSpeed * delta);
            if(this.moveTime >= this.SCENE_MOVE_TIME) {
                this.dayGroup.position.x = this.sceneMoveEnd;
                this.moveTime = 0;
                this.sceneMoving = false;
                this.setWeekStatus(this.currentDate.previousWeek, false);
            }
        }
    }

    nextDay() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let lastDay = this.currentDate.day;
        if(++this.currentDate.day >= this.daysThisMonth) {
            this.currentDate.day = 0;
            lastDay = this.daysThisMonth - 1;
        }

        let week = Math.floor(this.currentDate.day / 7);
        if(week !== this.currentDate.week) {
            this.setWeekStatus(week, true);
            this.currentDate.previousWeek = this.currentDate.week;
            this.moveToWeek(week, NEXT);
            this.currentDate.week = week;
            ++week;
            $('#weekNumber').html(week);
        }
        let day = this.currentDate.day;
        this.nodes[day].material = this.expenseMatSelected;
        this.nodes[day].material.needsUpdate = true;
        this.nodes[lastDay].material = this.expenseMat;
        this.nodes[lastDay].material.needsUpdate = true;
        this.stands[day].material = this.expenseMatSelected;
        this.stands[day].material.needsUpdate = true;
        this.stands[lastDay].material = this.expenseMat;
        this.stands[lastDay].material.needsUpdate = true;
        $('#day').html(DATES.dayNumbers[day]);

        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateExpenditure(total);
    }

    previousDay() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let lastDay = this.currentDate.day;
        if(--this.currentDate.day < 0) {
            this.currentDate.day = this.daysThisMonth-1;
            lastDay = 0;
        }

        let week = Math.floor(this.currentDate.day / 7);
        if(week !== this.currentDate.week) {
            this.setWeekStatus(week, true);
            this.currentDate.previousWeek = this.currentDate.week;
            this.moveToWeek(week, PREVIOUS);
            this.currentDate.week = week;
            ++week;
            $('#weekNumber').html(week);
        }

        let day = this.currentDate.day;
        this.nodes[day].material = this.expenseMatSelected;
        this.nodes[day].material.needsUpdate = true;
        this.nodes[lastDay].material = this.expenseMat;
        this.nodes[lastDay].material.needsUpdate = true;
        this.stands[day].material = this.expenseMatSelected;
        this.stands[day].material.needsUpdate = true;
        this.stands[lastDay].material = this.expenseMat;
        this.stands[lastDay].material.needsUpdate = true;
        $('#day').html(DATES.dayNumbers[day]);

        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateExpenditure(total);
    }

    moveToWeek(week, direction) {
        if(this.sceneMoving) return;

        let currentWeek = this.currentDate.week;
        let dir = week < currentWeek ? 1 : -1;
        if((currentWeek === 4 && week === 0) || (currentWeek === 0 && week === 4)) {
            dir = direction;
        }
        this.moveSpeed = this.weeklyGap / this.SCENE_MOVE_TIME;
        this.moveSpeed *= dir;
        this.sceneMoveEnd = this.weeklyGap * -week;
        this.sceneMoving = true;
        //DEBUG
        console.log("End = ", this.sceneMoveEnd);
    }

    setWeekStatus(week, status) {
        let start = START_WEEK_OFFSET * week;
        let end = start + WEEK_OFFSET;
        if(end > this.daysThisMonth) {
            end = this.daysThisMonth;
        }
        for(let i=start; i<end; ++i) {
            this.setNodeStatus(i, status);
        }
    }

    setNodeStatus(node, status) {
        this.nodes[node].visible = status;
        this.dayLabels[node].visible = status;
        this.spendLabels[node].visible = status;
        this.stands[node].visible = status;
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
        this.expenseIndex = -1;
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
        this.expenseIndex = -1;
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
        this.expenseIndex = -1;
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
        let label = spriteManager.getSpriteByIndex((day*2)+1);
        label.position.y = this.groundOffset + this.labelOffset + total;
        spriteManager.setTextAmount(label, total);
        this.nodes[day].position.y = this.groundOffset + total;
        this.stands[day].scale.y = this.nodes[day].position.y - BASE_OFFSET;
        this.stands[day].position.y = this.stands[day].scale.y / 2;
    }

    saveExpenses() {
        let expenseJSON = this.expenseManager.getAllExpensesJSON();
        //DEBUG
        console.log("JSON = ", expenseJSON);

        let bb = window.Blob;
        let fileName = "financeData.json";
        saveAs(new bb(
            [expenseJSON],
            {type: "text/plain;charset=" + document.characterSet}
            ),
            fileName);
    }

    loadExpenses(event) {
        let files = event.target.files;
        if(!files.length) {
            alert("No file specified!");
            return;
        }

        let dataFile = files[0];
        window.URL = window.URL || window.webkitURL;

        let fileUrl = window.URL.createObjectURL(dataFile);
        this.dataLoader.load(fileUrl, data => {
            this.expenseManager.loadExpenses(data);
            //Update expenditure
            //DEBUG
            //Fix for whole month
            let total;
            for(let i=1; i<3; ++i) {
                this.currentDate.day = i;
                total = this.expenseManager.getDailyTotal(this.currentDate);
                this.updateCurrentNode(total);
            }
            //Do first day expenditure
            this.currentDate.day = 0;
            total = this.expenseManager.getDailyTotal(this.currentDate);
            this.updateExpenditure(total);
            this.updateCurrentNode(total);
        });
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
    $('#nextDay').on("click", () => {
       app.nextDay();
    });

    $('#previousDay').on("click", () => {
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

    $('#saveExpenses').on("click", () => {
        app.saveExpenses();
    });

    $('#loadFile').on("change", evt => {
        app.loadExpenses(evt);
    });

    app.run();
});