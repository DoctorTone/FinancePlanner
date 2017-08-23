/**
 * Created by DrTone on 04/12/2014.
 */
//Visualisation framework
let FLOOR_WIDTH = 800;
let FLOOR_HEIGHT = 600;
let SEGMENTS = 8;
let EXPENSE_NOTHING = 0;
let EXPENSE_ADD = 1;
let EXPENSE_EDIT = 2;
const PREVIOUS = 1, NEXT = -1;
const START_POS_X = -105;
const START_POS_Y = 10;
const START_POS_Z = 0;
const STAND_SCALE = 4;
const MAIN_WIDTH = 300;
const MAIN_HEIGHT = 60;
const MAIN_DEPTH = 60;
const MAX_GROUPS = 4;
const WEEKLY_GAP = 245;

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

        this.currentGroup = 0;

        //Animation
        this.moveTime = 0;
        this.sceneMoving = false;
        this.SCENE_MOVE_TIME = 2;
        this.SCENE_ROTATE_INC = Math.PI/2;
        this.SCENE_ROTATE_TIME = 2;
        this.sceneRotating = false;
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

        //Main root group
        this.root = new THREE.Object3D();
        this.root.name = "rootGroup";
        this.addToScene(this.root);

        //Get hexagon
        let loader = new THREE.JSONLoader();
        loader.load("models/hexagon.json", (geometry, materials) => {
            //this.hexMesh = new THREE.Mesh(geometry, materials);
            this.expenseGeom = geometry;

            //Main cylinder geometry
            let bigGeom = new THREE.BoxBufferGeometry(MAIN_WIDTH, MAIN_HEIGHT, MAIN_DEPTH);
            let bigMat = new THREE.MeshLambertMaterial( {color: 0x5f5f5f} );
            let bigMesh = new THREE.Mesh(bigGeom, bigMat);
            this.root.add(bigMesh);

            //Container groups
            let repInfo = {};
            repInfo.geom = this.expenseGeom;
            let monthReps = [];
            let group;
            //Group positions/rotations
            let groupOffsets = [
                {y: MAIN_HEIGHT/2, z: 0, rot: 0},
                {y: 0, z: MAIN_HEIGHT/2, rot: Math.PI/2},
                {y: -MAIN_HEIGHT/2, z: 0, rot: Math.PI},
                {y: 0, z: -MAIN_HEIGHT/2, rot: -Math.PI/2}
            ];
            for(let i=0; i<MAX_GROUPS; ++i) {
                monthReps.push(new ExpendRepresentation());
                monthReps[i].setName("monthGroup" + i);
                group = monthReps[i].generateRepresentations(repInfo);
                this.root.add(group);
                group.position.y = groupOffsets[i].y;
                group.position.z = groupOffsets[i].z;
                group.rotation.x = groupOffsets[i].rot;
            }
            this.monthReps = monthReps;

            //Initialisation
            for(let i=0; i<MAX_GROUPS; ++i) {
                this.monthReps[i].setWeekStatus(0, true);
                this.monthReps[i].clearSelection();
            }
            this.monthReps[0].setSelection(0);
            this.weeklyGap = WEEKLY_GAP;
            this.groundOffset = START_POS_Y;
            this.labelOffset = EXPEND_LABEL.Y_OFFSET;
        });

        //Floor
        //this.addFloor();
    }

    addFloor() {
        let planeGeom = new THREE.PlaneBufferGeometry(FLOOR_WIDTH, FLOOR_HEIGHT, SEGMENTS, SEGMENTS);
        let planeMat = new THREE.MeshLambertMaterial( {color: 0x444444});
        let plane = new THREE.Mesh(planeGeom, planeMat);
        plane.rotation.x = -Math.PI/2;
        this.addToScene(plane);
    }

    update() {
        super.update();

        let delta = this.clock.getDelta();
        this.elapsedTime += delta;

        if(this.sceneMoving) {
            let group = this.monthReps[this.currentGroup];
            this.moveTime += delta;
            group.updateGroup(this.moveSpeed * delta);
            if(this.moveTime >= this.SCENE_MOVE_TIME) {
                group.moveGroup(this.sceneMoveEnd);
                this.moveTime = 0;
                this.sceneMoving = false;
                group.setWeekStatus(group.getPreviousWeek(), false);
            }
        }

        if(this.sceneRotating) {
            this.moveTime += delta;
            this.root.rotation.x += (this.rotateSpeed * delta);
            if(this.moveTime >= this.SCENE_ROTATE_TIME) {
                this.moveTime = 0;
                this.sceneRotating = false;
                this.root.rotation.x = this.sceneRotateEnd;
            }
        }
    }

    nextDay() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let group = this.monthReps[this.currentGroup];
        let maxDays = group.getDaysThisMonth();
        let currentDay = group.getCurrentDay();
        let lastDay = currentDay;
        if(++currentDay >= maxDays) {
            currentDay = 0;
            lastDay = maxDays - 1;
        }

        let currentWeek = group.getCurrentWeek();
        let week = Math.floor(currentDay / 7);
        if(week !== currentWeek) {
            group.setWeekStatus(week, true);
            group.setPreviousWeek(currentWeek);
            this.moveToWeek(week, NEXT);
            group.setCurrentWeek(week);
            ++week;
            $('#weekNumber').html(week);
        }

        group.setCurrentDay(currentDay);
        group.selectNodes(currentDay, lastDay);
        $('#day').html(DATES.dayNumbers[currentDay]);

        let total = this.expenseManager.getDailyTotal(group.getCurrentDate());
        this.updateExpenditure(total);
    }

    previousDay() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let group = this.monthReps[this.currentGroup];
        let maxDays = group.getDaysThisMonth();
        let currentDay = group.getCurrentDay();
        let lastDay = currentDay;
        if(--currentDay < 0) {
            currentDay = maxDays-1;
            lastDay = 0;
        }

        let currentWeek = group.getCurrentWeek();
        let week = Math.floor(currentDay / 7);
        if(week !== currentWeek) {
            group.setWeekStatus(week, true);
            group.setPreviousWeek(currentWeek);
            this.moveToWeek(week, PREVIOUS);
            group.setCurrentWeek(week);
            ++week;
            $('#weekNumber').html(week);
        }

        group.setCurrentDay(currentDay);
        group.selectNodes(currentDay, lastDay);
        $('#day').html(DATES.dayNumbers[currentDay]);

        let total = this.expenseManager.getDailyTotal(group.getCurrentDate());
        this.updateExpenditure(total);
    }

    nextWeek() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let group = this.monthReps[this.currentGroup];
        let maxDays = group.getDaysThisMonth();
        let maxDay = maxDays - 1;
        let lastDay = group.getCurrentDay();
        let day = lastDay + 7;
        if(day > maxDay) {
            day = maxDay;
        }

        let currentWeek = group.getCurrentWeek();
        group.setPreviousWeek(currentWeek);
        if(++currentWeek > group.getWeeksThisMonth()) {
            currentWeek = 0;
            day = 0;
        }

        group.setWeekStatus(currentWeek, true);
        this.moveToWeek(currentWeek, NEXT);
        group.setCurrentWeek(currentWeek);
        ++currentWeek;
        $('#weekNumber').html(currentWeek);
        group.selectNodes(day, lastDay);
        group.setCurrentDay(day);
        $('#day').html(DATES.dayNumbers[day]);

        let total = this.expenseManager.getDailyTotal(group.getCurrentDate());
        this.updateExpenditure(total);
    }

    previousWeek() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let group = this.monthReps[this.currentGroup];
        let maxDays = group.getDaysThisMonth();
        let maxDay = maxDays - 1;
        let lastDay = group.getCurrentDay();
        let day = lastDay - 7;
        if(day < 0) {
            day = 0;
        }
        let currentWeek = group.getCurrentWeek();
        group.setPreviousWeek(currentWeek);
        if(--currentWeek < 0) {
            currentWeek = group.getWeeksThisMonth();
            day = maxDay;
        }

        group.setWeekStatus(currentWeek, true);
        this.moveToWeek(currentWeek, PREVIOUS);
        group.setCurrentWeek(currentWeek);
        ++currentWeek;
        $('#weekNumber').html(currentWeek);
        group.selectNodes(day, lastDay);
        group.setCurrentDay(day);
        $('#day').html(DATES.dayNumbers[day]);

        let total = this.expenseManager.getDailyTotal(group.getCurrentDate());
        this.updateExpenditure(total);
    }

    moveToWeek(week, direction) {
        if(this.sceneMoving) return;

        let group = this.monthReps[this.currentGroup];

        let currentWeek = group.getCurrentWeek();
        let dir = week < currentWeek ? 1 : -1;
        if((currentWeek === 4 && week === 0) || (currentWeek === 0 && week === 4)) {
            dir = direction;
        }
        this.moveSpeed = this.weeklyGap / this.SCENE_MOVE_TIME;
        this.moveSpeed *= dir;
        this.sceneMoveEnd = this.weeklyGap * -week;
        this.sceneMoving = true;
        //DEBUG
        //console.log("End = ", this.sceneMoveEnd);
    }

    nextMonth() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        this.rotateSpeed = -this.SCENE_ROTATE_INC / this.SCENE_ROTATE_TIME;
        this.sceneRotateEnd = this.root.rotation.x - this.SCENE_ROTATE_INC;
        this.sceneRotating = true;

        let previousGroup = this.monthReps[this.currentGroup];
        let previousDate = previousGroup.getCurrentDate();
        previousGroup.clearSelection();
        previousDate.month++;
        if(++this.currentGroup >= MAX_GROUPS) {
            this.currentGroup = 0;
        }
        let currentGroup = this.monthReps[this.currentGroup];
        currentGroup.setCurrentDate(previousDate);
        currentGroup.setSelection(previousDate.day);
    }

    previousMonth() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        this.rotateSpeed = this.SCENE_ROTATE_INC / this.SCENE_ROTATE_TIME;
        this.sceneRotateEnd = this.root.rotation.x + this.SCENE_ROTATE_INC;
        this.sceneRotating = true;

        let previousGroup = this.monthReps[this.currentGroup];
        let previousDate = previousGroup.getCurrentDate();
        previousGroup.clearSelection();
        previousDate.month--;
        if(--this.currentGroup < 0) {
            this.currentGroup = MAX_GROUPS-1;
        }
        let currentGroup = this.monthReps[this.currentGroup];
        currentGroup.setCurrentDate(previousDate);
        currentGroup.setSelection(previousDate.day);
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

        let group = this.monthReps[this.currentGroup];
        let date = group.getCurrentDate();
        let expense = new Expense(date, expenseInfo);

        state === EXPENSE_EDIT ? this.expenseManager.updateExpense(expense, this.expenseIndex) :
            this.expenseManager.addExpense(expense);

        let total = this.expenseManager.getDailyTotal(date);
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
        let group = this.monthReps[this.currentGroup];
        let expenses = this.expenseManager.getExpenses(group.getCurrentDate());
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
        let group = this.monthReps[this.currentGroup];
        this.expenseManager.deleteExpense(group.getCurrentDate(), this.expenseIndex);
        let total = this.expenseManager.getDailyTotal(group.getCurrentDate());
        this.updateCurrentNode(total);
        this.updateExpenditure(total);
        $('#expenseTableContainer').hide();
        this.showExpense();
        this.expenseIndex = -1;
    }

    populateAddForm() {
        $('#addFormTitle').html("Edit expense");
        let group = this.monthReps[this.currentGroup];
        let expense = this.expenseManager.getExpense(group.getCurrentDate(), this.expenseIndex);
        if(!expense) {
            console.log("No expense for that date");
            return;
        }
        $('#amount').val(expense.price);
        $('#item').val(expense.priceInfo.item);
        $('#tags').val(expense.priceInfo.tags);
    }

    updateCurrentNode(total) {
        let group = this.monthReps[this.currentGroup];
        let day = group.getCurrentDay();
        let label = spriteManager.getSpriteByIndex((day*2)+1);
        label.position.y = this.groundOffset + this.labelOffset + total;
        spriteManager.setTextAmount(label, total);
        group.updateCurrentNode(total);
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

    $('#nextWeek').on("click", () => {
        app.nextWeek();
    });

    $('#previousWeek').on("click", () => {
        app.previousWeek();
    });

    $('#nextMonth').on("click", () => {
        app.nextMonth();
    });

    $('#previousMonth').on("click", () => {
        app.previousMonth();
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