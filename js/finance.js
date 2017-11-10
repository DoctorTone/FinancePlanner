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
const MAIN_WIDTH = 1200;
const MAIN_HEIGHT = 60;
const MAIN_DEPTH = 60;
const MAX_GROUPS = 4;
const WEEKLY_GAP = 245;
const DEFAULT_CAM_POS = new THREE.Vector3(0, 230, 500);
const DEFAULT_LOOKAT_POS = new THREE.Vector3(0, 200, 0);
const X_AXIS = 0;
const Y_AXIS = 1;
const ZOOM_SPEED = 20;

let appearanceConfig = {
    Back: '#7d818c',
    Node: '#fed600',
    Ground: '#5f5f5f'
};

let saveConfig = {
    Back: appearanceConfig.Back,
    Node: appearanceConfig.Node,
    Ground: appearanceConfig.Ground
};

function isMultipleWords(text) {
    let result;
    let separators = [' ', ',', '#'];
    for(let i=0, numResults=separators.length; i<numResults; ++i) {
        result = text.split(separators[i]);
        if(result.length > 1) {
            return true;
        }
    }

    return false;
}

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

        this.baseName = "financeVizConfig";

        //Animation
        this.moveTime = 0;
        this.sceneMoving = false;
        this.SCENE_MOVE_TIME = 2;
        this.SCENE_ROTATE_INC = Math.PI/2;
        this.SCENE_ROTATE_TIME = 2;
        this.sceneRotating = false;

        //Views
        this.monthView = false;
        this.portraitCamOffset = new THREE.Vector3(0, 745, 2300);
        this.portraitLookAtOffset = new THREE.Vector3(0, 785, 0);
        this.landscapeCamOffset = new THREE.Vector3(0, 430, 875);
        this.landscapeLookAtOffset = new THREE.Vector3(0, 310, 0);

        //Zoom controls
        this.zoomingOut = false;
        this.zoomingIn = false;

        this.messageTimer = 3 * 1000;
    }

    init(container) {
        super.init(container);

        //Load any preferences
        let prefs = localStorage.getItem(this.baseName + "Saved");
        if(prefs) {
            let value;
            for(let prop in appearanceConfig) {
                value = localStorage.getItem(this.baseName + prop);
                if(value) {
                    this.setGUI(prop,value);
                }
            }
            let colour = localStorage.getItem(this.baseName + "Back");
            if(colour) {
                this.renderer.setClearColor(colour, 1.0);
            }
        }

        //Data loading
        this.dataLoader = new DataJSONLoader();

        //Expenses
        this.expenseManager = new ExpenseManager();

        //Load any config
        this.bgColour = localStorage.getItem("financeConfig");
    }

    createGUI() {
        //Create GUI - controlKit
        window.addEventListener('load', () => {
            let labelConfig = {
                dateHeight: 1,
                dateHeightRange: [0.5, 3],
                dateWidth: 1,
                dateWidthRange: [0.5, 3],
                amountHeight: 1,
                amountHeightRange: [0.5, 3],
                amountWidth: 1,
                amountWidthRange: [0.5, 3],
            };
            let nodeConfig = {
                nodeScale: 1,
                nodeScaleRange: [0.1, 10]
            };

            let controlKit = new ControlKit();

            let guiWidth = $('#guiWidth').css("width");
            guiWidth = parseInt(guiWidth, 10);
            if(!guiWidth) guiWidth = window.innerWidth * 0.1;

            controlKit.addPanel( {label: "Configure", width: guiWidth, enable: false} )
                .addSubGroup({label: "Appearance", enable: false })
                    .addColor(appearanceConfig, "Back", {
                        colorMode: "hex", onChange: () => {
                            this.onBackgroundColourChanged(appearanceConfig.Back);
                        }
                    })
                    .addColor(appearanceConfig, "Node", {
                        colorMode: "hex", onChange: () => {
                            this.onNodeColourChanged(appearanceConfig.Node);
                        }
                    })
                    .addColor(appearanceConfig, "Ground", {
                        colorMode: "hex", onChange: () => {
                            this.onGroundColourChanged(appearanceConfig.Ground);
                        }
                    })
                .addSubGroup({label: "Dates", enable: false})
                    .addSlider(labelConfig, "dateHeight", "dateHeightRange", { label: "Height", dp: 1, onChange: () => {
                        this.onDateLabelScale(Y_AXIS, labelConfig.dateHeight);
                    }})
                    .addSlider(labelConfig, "dateWidth", "dateWidthRange", { label: "Width", dp: 1, onChange: () => {
                        this.onDateLabelScale(X_AXIS, labelConfig.dateWidth);
                    }})
                .addSubGroup({label: "Amounts", enable: false})
                    .addSlider(labelConfig, "amountHeight", "amountHeightRange", { label: "Height", dp: 1, onChange: () => {
                        this.onAmountLabelScale(Y_AXIS, labelConfig.amountHeight);
                    }})
                    .addSlider(labelConfig, "amountWidth", "amountWidthRange", { label: "Width", dp: 1, onChange: () => {
                        this.onAmountLabelScale(X_AXIS, labelConfig.amountWidth);
                    }})
                .addSubGroup({label: "Nodes", enable: false})
                    .addSlider(nodeConfig, "nodeScale", "nodeScaleRange", { label: "Height", dp: 1, onChange: () => {
                        this.nodeHeightChanged(nodeConfig.nodeScale);
                    }})
                .addSubGroup({label: "Preferences"})
                    .addButton("Save", () => {
                        for(let prop in saveConfig) {
                            if(prop in appearanceConfig) {
                                saveConfig[prop] = appearanceConfig[prop];
                            }
                        }
                        this.savePreferences(saveConfig);
                    })
        });
    }

    onBackgroundColourChanged(colour) {
        this.renderer.setClearColor(colour, 1.0);
    }

    onNodeColourChanged(colour) {
        let group;
        for(let i=0; i<MAX_GROUPS; ++i) {
            group = this.monthReps[i];
            group.setExpenseColour(colour);
        }
    }

    onGroundColourChanged(colour) {
        this.bigMesh.material.color.setStyle(colour);
    }

    onDateLabelScale(axis, scale) {
        let i, group;
        switch(axis) {
            case X_AXIS:
                for(i=0; i<MAX_GROUPS; ++i) {
                    group = this.monthReps[i];
                    group.setDateLabelWidth(scale);
                }
                break;

            case Y_AXIS:
                for(i=0; i<MAX_GROUPS; ++i) {
                    group = this.monthReps[i];
                    group.setDateLabelHeight(scale);
                }
                break;

            default:
                break;
        }
    }

    onAmountLabelScale(axis, scale) {
        let i, group;
        switch(axis) {
            case X_AXIS:
                for(i=0; i<MAX_GROUPS; ++i) {
                    group = this.monthReps[i];
                    group.setAmountLabelWidth(scale);
                }
                break;

            case Y_AXIS:
                for(i=0; i<MAX_GROUPS; ++i) {
                    group = this.monthReps[i];
                    group.setAmountLabelHeight(scale);
                }
                break;

            default:
                break;
        }
    }

    nodeHeightChanged(scale) {
        let group;
        for(let i=0; i<MAX_GROUPS; ++i) {
            group = this.monthReps[i];
            group.setStandHeight(scale);
        }
    }

    savePreferences(config) {
        for(let prop in config) {
            localStorage.setItem(this.baseName+prop, config[prop]);
        }
        localStorage.setItem(this.baseName+"Saved", "Saved");
        this.displayMessage("Preferences saved");
    }

    setGUI(prop, value) {
        let newValue = parseFloat(value);
        if(isNaN(newValue)) {
            appearanceConfig[prop] = value;
            return;
        }
        appearanceConfig[prop] = newValue;
    }

    getPreferences() {
        let config = localStorage.getItem(this.baseName+"Saved");
        if(!config) return config;
        let configuration = {};
    }

    createScene() {
        //Create scene
        super.createScene();

        this.fitToScreen();

        //Main root group
        this.root = new THREE.Object3D();
        this.root.name = "rootGroup";
        this.addToScene(this.root);
        this.topGroup = new THREE.Object3D();
        this.topGroup.name = "topGroup";
        this.root.add(this.topGroup);

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
            this.bigMesh = bigMesh;

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
            //Set today's date
            let date = new Date();
            let currentDate = {};
            currentDate.day = date.getDate() - 1;
            currentDate.week = Math.floor(currentDate.day / 7);
            currentDate.month = date.getMonth();
            currentDate.year = date.getFullYear();
            this.currentDate = currentDate;

            for(let i=0; i<MAX_GROUPS; ++i) {
                monthReps.push(new ExpendRepresentation());
                monthReps[i].setName("monthGroup" + i);
                monthReps[i].setMonth(currentDate.month - i);
                group = monthReps[i].generateRepresentations(repInfo);
                this.topGroup.add(group);
                group.position.y = groupOffsets[i].y;
                group.position.z = groupOffsets[i].z;
                group.rotation.x = groupOffsets[i].rot;
            }
            this.monthReps = monthReps;

            //Initialisation
            for(let i=0; i<MAX_GROUPS; ++i) {
                this.monthReps[i].showWeek(currentDate.month, currentDate.week, true);
                this.monthReps[i].clearSelection();
            }
            group = this.monthReps[0];
            group.setSelection(currentDate.day);
            this.weeklyGap = WEEKLY_GAP;
            this.groundOffset = START_POS_Y;
            this.labelOffset = EXPEND_LABEL.Y_OFFSET;
            this.topGroup.position.x = this.weeklyGap * -currentDate.week;
            this.updateDateInfo(currentDate);
            //Set initial total
            let total = this.expenseManager.getDailyTotal(currentDate);
            this.updateExpenditure(total);
            total = this.expenseManager.getMonthlyTotal(currentDate);
            this.updateMonthlyExpenditure(total);
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

    fitToScreen() {
        //If in portrait mode then move camera
        if(window.innerHeight > window.innerWidth) {
            this.setMode(PORTRAIT);
            this.setCamera(PORTRAIT);
        } else {
            this.setMode(LANDSCAPE);
            this.setCamera(LANDSCAPE);
        }
    }

    update() {
        super.update();

        let delta = this.clock.getDelta();
        this.elapsedTime += delta;

        if(this.sceneMoving) {
            let group = this.monthReps[this.currentGroup];
            this.moveTime += delta;
            //group.updateGroup(this.moveSpeed * delta);
            this.topGroup.position.x += (this.moveSpeed * delta);
            if(this.moveTime >= this.SCENE_MOVE_TIME) {
                //group.moveGroup(this.sceneMoveEnd);
                this.topGroup.position.x = this.sceneMoveEnd;
                this.moveTime = 0;
                this.sceneMoving = false;
                for(let i=0; i<MAX_GROUPS; ++i) {
                    group = this.monthReps[i];
                    group.showWeek(this.currentDate.month, this.previousWeek, false);
                }

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

        if(this.zoomingOut) {
            this.root.position.z -= ZOOM_SPEED * delta;
        }

        if(this.zoomingIn) {
            this.root.position.z += ZOOM_SPEED * delta;
        }
    }

    updateDateInfo(date) {
        $('#dayNumber').html(DATES.dayNumbers[date.day]);
        $('#weekNumber').html(date.week + 1);
        $('#monthNumber').html(DATES.monthNames[date.month]);
        $('#yearNumber').html(date.year);
    }

    nextDay() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let group = this.monthReps[this.currentGroup];
        let maxDays = DATES.daysPerMonth[this.currentDate.month];
        let lastDay = this.currentDate.day;
        if(++this.currentDate.day >= maxDays) {
            this.currentDate.day = 0;
            lastDay = maxDays - 1;
        }

        let currentWeek = this.currentDate.week;
        let week = Math.floor(this.currentDate.day / 7);
        if(week !== currentWeek) {
            if(!this.monthView) {
                this.previousWeek = currentWeek;
                group.showWeek(this.currentDate.month, week, true);
                this.moveToWeek(week, NEXT);
            }
            this.currentDate.week = week;
            let weekNumber = week + 1;
            $('#weekNumber').html(weekNumber);
        }

        group.setCurrentDay(this.currentDate.day);
        group.selectNodes(this.currentDate.day, lastDay);
        $('#dayNumber').html(DATES.dayNumbers[this.currentDate.day]);

        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateExpenditure(total);
    }

    previousDay() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let group = this.monthReps[this.currentGroup];
        let maxDays = DATES.daysPerMonth[this.currentDate.month];
        let lastDay = this.currentDate.day;
        if(--this.currentDate.day < 0) {
            this.currentDate.day = maxDays-1;
            lastDay = 0;
        }

        let currentWeek = this.currentDate.week;
        let week = Math.floor(this.currentDate.day / 7);
        if(week !== currentWeek) {
            if(!this.monthView) {
                this.previousWeek = currentWeek;
                group.showWeek(this.currentDate.month, week, true);
                this.moveToWeek(week, PREVIOUS);
            }
            this.currentDate.week = week;
            let weekNumber = week + 1;
            $('#weekNumber').html(weekNumber);
        }

        group.setCurrentDay(this.currentDate.day);
        group.selectNodes(this.currentDate.day, lastDay);
        $('#dayNumber').html(DATES.dayNumbers[this.currentDate.day]);

        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateExpenditure(total);
    }

    gotoNextWeek() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let group = this.monthReps[this.currentGroup];
        let maxDays = DATES.daysPerMonth[this.currentDate.month];
        let maxDay = maxDays - 1;
        let lastDay = this.currentDate.day;
        let day = lastDay + 7;
        if(day > maxDay) {
            day = maxDay;
        }
        this.currentDate.day = day;

        let weeksThisMonth = DATES.weeksPerMonth[this.currentDate.month] -1;
        this.previousWeek = this.currentDate.week;
        if(++this.currentDate.week > weeksThisMonth) {
            this.currentDate.week = 0;
            this.currentDate.day = 0;
        }

        if(!this.monthView) {
            this.moveToWeek(this.currentDate.week, NEXT);
        }
        let weekNumber = this.currentDate.week + 1;
        $('#weekNumber').html(weekNumber);
        group.selectNodes(this.currentDate.day, lastDay);
        group.setCurrentDay(this.currentDate.day);
        $('#dayNumber').html(DATES.dayNumbers[this.currentDate.day]);

        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateExpenditure(total);
    }

    gotoPreviousWeek() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving) return;

        let group = this.monthReps[this.currentGroup];
        let maxDays = DATES.daysPerMonth[this.currentDate.month];
        let maxDay = maxDays - 1;
        let lastDay = this.currentDate.day;
        let day = lastDay - 7;
        if(day < 0) {
            day = maxDay;
        }
        this.currentDate.day = day;
        this.previousWeek = this.currentDate.week;
        if(--this.currentDate.week < 0) {
            this.currentDate.week = DATES.weeksPerMonth[this.currentDate.month] -1;
            this.currentDate.day = maxDay;
        }

        if(!this.monthView) {
            this.moveToWeek(this.currentDate.week, PREVIOUS);
        }
        let weekNumber = this.currentDate.week + 1;
        $('#weekNumber').html(weekNumber);
        group.selectNodes(this.currentDate.day, lastDay);
        group.setCurrentDay(this.currentDate.day);
        $('#dayNumber').html(DATES.dayNumbers[this.currentDate.day]);

        let total = this.expenseManager.getDailyTotal(this.currentDate);
        this.updateExpenditure(total);
    }

    moveToWeek(week, direction) {
        if(this.sceneMoving) return;

        //Do for all groups
        let group;
        for(let i=0; i<MAX_GROUPS; ++i) {
            group = this.monthReps[i];
            group.showWeek(this.currentDate.month, this.currentDate.week, true);
        }

        this.moveSpeed = this.weeklyGap / this.SCENE_MOVE_TIME;
        this.moveSpeed *= direction;
        this.sceneMoveEnd = this.weeklyGap * -week;
        this.sceneMoving = true;
        //DEBUG
        //console.log("End = ", this.sceneMoveEnd);
    }

    previousMonth() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving || this.sceneRotating) return;

        this.rotateSpeed = -this.SCENE_ROTATE_INC / this.SCENE_ROTATE_TIME;
        this.sceneRotateEnd = this.root.rotation.x - this.SCENE_ROTATE_INC;
        this.sceneRotating = true;

        let previousGroup = this.monthReps[this.currentGroup];
        previousGroup.clearSelection();
        if(++this.currentGroup >= MAX_GROUPS) {
            this.currentGroup = 0;
        }

        let currentGroup = this.monthReps[this.currentGroup];
        //Get month from group as we're only showing certain months
        this.currentDate.month = currentGroup.getMonth();
        currentGroup.showWeek(this.currentDate.month, this.currentDate.week, true);
        let maxDays = DATES.daysPerMonth[this.currentDate.month]-1;
        if(this.currentDate.day >= maxDays) {
            this.currentDate.day = maxDays;
            $('#dayNumber').html(DATES.dayNumbers[this.currentDate.day]);
            let total = this.expenseManager.getDailyTotal(this.currentDate);
            this.updateExpenditure(total);
        }
        currentGroup.setCurrentDay(this.currentDate.day);
        currentGroup.setSelection(this.currentDate.day);

        $('#monthNumber').html(DATES.monthNames[this.currentDate.month]);

        let currentDate = this.currentDate;
        let total = this.expenseManager.getDailyTotal(currentDate);
        this.updateExpenditure(total);
        total = this.expenseManager.getMonthlyTotal(currentDate);
        this.updateMonthlyExpenditure(total);
    }

    nextMonth() {
        if(this.expenseState !== EXPENSE_NOTHING) return;
        if(this.sceneMoving || this.sceneRotating) return;

        this.rotateSpeed = this.SCENE_ROTATE_INC / this.SCENE_ROTATE_TIME;
        this.sceneRotateEnd = this.root.rotation.x + this.SCENE_ROTATE_INC;
        this.sceneRotating = true;

        let previousGroup = this.monthReps[this.currentGroup];
        previousGroup.clearSelection();
        this.currentDate.month--;
        if(--this.currentGroup < 0) {
            this.currentGroup = MAX_GROUPS-1;
        }
        let currentGroup = this.monthReps[this.currentGroup];
        //Get month from group as we're only showing certain months
        this.currentDate.month = currentGroup.getMonth();
        currentGroup.showWeek(this.currentDate.month, this.currentDate.week, true);
        let maxDays = DATES.daysPerMonth[this.currentDate.month]-1;
        if(this.currentDate.day >= maxDays) {
            this.currentDate.day = maxDays;
            $('#dayNumber').html(DATES.dayNumbers[this.currentDate.day]);
            let total = this.expenseManager.getDailyTotal(this.currentDate);
            this.updateExpenditure(total);
        }
        if(this.currentDate.day > DATES.daysPerMonth[this.currentDate.month]) {
            --this.currentDate.day;
        }
        currentGroup.setCurrentDay(this.currentDate.day);
        currentGroup.setSelection(this.currentDate.day);

        $('#monthNumber').html(DATES.monthNames[this.currentDate.month]);

        let currentDate = this.currentDate;
        let total = this.expenseManager.getDailyTotal(currentDate);
        this.updateExpenditure(total);
        total = this.expenseManager.getMonthlyTotal(currentDate);
        this.updateMonthlyExpenditure(total);
    }

    updateExpenditure(total) {
        $('#dailyExpenditure').html(total.toFixed(2));
    }

    updateMonthlyExpenditure(total) {
        $('#monthlyExpenditure').html(total.toFixed(2));
    }

    addExpense() {
        this.expenseState = EXPENSE_ADD;
        $('#errorText').html("");
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
        let date = this.currentDate;
        let expense = new Expense(date, expenseInfo);

        state === EXPENSE_EDIT ? this.expenseManager.updateExpense(expense, this.expenseIndex) :
            this.expenseManager.addExpense(expense);

        let total = this.expenseManager.getDailyTotal(date);
        this.updateNode(date, total);
        this.updateExpenditure(total);
        total = this.expenseManager.getMonthlyTotal(date);
        this.updateMonthlyExpenditure(total);
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
        let category = form["tags"].value;
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
                //Only enter one category
                if(isMultipleWords(category)) {
                    errorElem.html("Only one category allowed!");
                    errorElem.show();
                    return false;
                }
                amountElem.removeClass("has-error");
                errorElem.html("No item text!");
                errorElem.hide();
                amount = parseFloat(amount);
                //Ensure text is valid as well
                if(item !== "") {
                    $('#addFormContainer').hide();
                    this.currentAmount = amount;
                    this.currentItem = item;
                    this.currentTags = category;
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
        let currentDate = this.currentDate;
        this.expenseManager.deleteExpense(currentDate, this.expenseIndex);
        let dailyTotal = this.expenseManager.getDailyTotal(currentDate);
        this.updateNode(currentDate, dailyTotal);
        this.updateExpenditure(dailyTotal);
        let monthlyTotal = this.expenseManager.getMonthlyTotal(currentDate);
        this.updateMonthlyExpenditure(monthlyTotal);
        $('#expenseTableContainer').hide();
        if(dailyTotal) {
            this.showExpense();
        }
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

    updateNode(date, total) {
        let group = this.monthReps[this.currentGroup];
        let label = spriteManager.getSpriteByDate(date.day, this.currentGroup);
        label.position.y = this.labelOffset + total;
        spriteManager.setTextAmount(label, total);
        group.updateNode(date, total);
    }

    toggleView() {
        this.monthView = !this.monthView;
        let buttonElem = $('#toggleView');
        let group, mode = this.getMode();
        if(this.monthView) {
            buttonElem.html("Week view");
            for(let i=0; i<MAX_GROUPS; ++i) {
                group = this.monthReps[i];
                group.showAllWeeks(this.currentDate, true);
            }
            this.topGroup.position.x = -this.weeklyGap * 1.75;
            if(mode === PORTRAIT) {
                this.camera.position.copy(this.portraitCamOffset);
                this.controls.setLookAt(this.portraitLookAtOffset);
            } else {
                this.camera.position.copy(this.landscapeCamOffset);
                this.controls.setLookAt(this.landscapeLookAtOffset);
            }
        } else {
            buttonElem.html("Month view");
            for(let i=0; i<MAX_GROUPS; ++i) {
                group = this.monthReps[i];
                group.showAllWeeks(this.currentDate, false);
                group.showWeek(this.currentDate.month, this.currentDate.week, true);
            }
            this.topGroup.position.x = -this.weeklyGap * this.currentDate.week;
            this.fitToScreen();
        }
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
            let expenses = this.expenseManager.loadExpenses(data);
            if(expenses) {
                //Update expenditure
                let currentExpense, total, date;
                for(let i=0, numExpenses = expenses.length; i<numExpenses; ++i) {
                    currentExpense = expenses[i];
                    date = currentExpense[0].date;
                    total = this.expenseManager.getDailyTotal(date);
                    this.updateNode(date, total);
                }
                //Update current date and month
                total = this.expenseManager.getDailyTotal(this.currentDate);
                this.updateExpenditure(total);
                total = this.expenseManager.getMonthlyTotal(this.currentDate);
                this.updateMonthlyExpenditure(total);
            }
        });
    }

    zoomOut(zoom) {
        this.zoomingOut = zoom;
    }

    zoomIn(zoom) {
        this.zoomingIn = zoom;
    }

    displayMessage(msg) {
        $('#content').html(msg);
        $('#message').show();
        setTimeout( () => {
            $('#message').hide();
        }, this.messageTimer);
    }

    stopNotifications(elemList) {
        for(let i=0, numElems=elemList.length; i<numElems; ++i) {
            $('#' + elemList[i]).contextmenu(() => {
                return false;
            });
        }
    }
}

$(document).ready(function() {
    //Check for webgl support
    if(!Detector.webgl) {
        $('#notSupported').show();
        return;
    }
    //Initialise app
    let container = document.getElementById("WebGL-output");
    let app = new Finance();
    app.init(container);
    app.createScene();
    app.createGUI();

    //GUI callbacks
    $('#nextDay').on("click", () => {
       app.nextDay();
    });

    $('#previousDay').on("click", () => {
        app.previousDay();
    });

    $('#nextWeek').on("click", () => {
        app.gotoNextWeek();
    });

    $('#previousWeek').on("click", () => {
        app.gotoPreviousWeek();
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

    $('#toggleView').on("click", () => {
        app.toggleView();
    });

    let zoomOutElement = $('#zoomOut');
    let zoomInElement = $('#zoomIn');
    zoomOutElement.on("mousedown", () => {
        app.zoomOut(true);
    });

    zoomOutElement.on("mouseup", () => {
        app.zoomOut(false);
    });

    zoomOutElement.on("touchstart", () => {
        app.zoomOut(true);
    });

    zoomOutElement.on("touchend", () => {
        app.zoomOut(false);
    });

    zoomInElement.on("mousedown", () => {
        app.zoomIn(true);
    });

    zoomInElement.on("mouseup", () => {
        app.zoomIn(false);
    });

    zoomInElement.on("touchstart", () => {
        app.zoomIn(true);
    });

    zoomInElement.on("touchend", () => {
        app.zoomIn(false);
    });

    let elemList = ["zoomControls", "dateSelector", "editSelector", "fileSelector", "expenseInfo", "instructions", "copyright"];
    app.stopNotifications(elemList);

    app.run();
});