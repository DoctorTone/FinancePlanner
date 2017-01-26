/**
 * Created by DrTone on 04/12/2014.
 */
//Visualisation framework
var NUM_DAYS = 7;
var FLOOR_WIDTH = 800;
var FLOOR_HEIGHT = 600;
var SEGMENTS = 8;
var NODE_RADIUS = 5;
var NODE_SEGMENTS = 24;

//Init this app from base
function Finance() {
    BaseApp.call(this);
}

Finance.prototype = new BaseApp();

Finance.prototype.init = function(container) {
    BaseApp.prototype.init.call(this, container);
    //GUI
    this.guiControls = null;
    this.gui = null;

    //Current item
    this.currentAmount = 0;
    this.currentItem = undefined;
    this.currentTags = [];
    this.expenseIndex = undefined;

    //Date info
    this.currentDate = {};
    this.currentDate.day = 0;
    this.currentDate.month = 9;
    this.currentDate.year = 2016;
};

Finance.prototype.createScene = function() {
    //Create scene
    BaseApp.prototype.createScene.call(this);

    //Floor
    var planeGeom = new THREE.PlaneBufferGeometry(FLOOR_WIDTH, FLOOR_HEIGHT, SEGMENTS, SEGMENTS);
    var planeMat = new THREE.MeshLambertMaterial( {color: 0x444444});
    var plane = new THREE.Mesh(planeGeom, planeMat);
    plane.rotation.x = -Math.PI/2;
    this.scene.add(plane);

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
    this.scene.add(label);

    var dayScale = new THREE.Vector3(30, 30, 1);
    for(i=0; i<NUM_DAYS; ++i) {
        node = new THREE.Mesh(sphereGeom, i===this.currentDate.day ? this.sphereMatSelected : this.sphereMat);
        node.position.set(xStart+(xInc*i), yStart, zStart);
        this.nodes.push(node);
        this.scene.add(node);
        pos.copy(node.position);
        pos.add(dayLabelOffset);
        label = spriteManager.create(DATES.DayNumbers[i], pos, dayScale, 32, 1, true, false);
        this.scene.add(label);
        pos.copy(node.position);
        pos.add(expendLabelOffset);
        label = spriteManager.create("£0.00", pos, dayScale, 32, 1, true, false);
        this.scene.add(label);
    }
    this.groundOffset = yStart;
    this.labelOffset = expendLabelOffset.y;
};

Finance.prototype.createGUI = function() {
    //GUI - using dat.GUI
    var _this = this;
    this.guiControls = new function() {
        this.Background = '#d8dee8';
    };

    var gui = new dat.GUI();

    //Add some folders
    this.guiAppear = gui.addFolder("Appearance");
    this.guiAppear.addColor(this.guiControls, 'Background').onChange(function (value) {
        _this.renderer.setClearColor(value, 1.0);
    });

    this.guiData = gui.addFolder("Data");
    this.gui = gui;
};

Finance.prototype.update = function() {
    //Perform any updates

    BaseApp.prototype.update.call(this);
};

Finance.prototype.nextDay = function() {
    if(++this.currentDate.day > 30) {
        this.currentDate.day = 30;
        return;
    }

    var day = this.currentDate.day;
    this.nodes[day].material = this.sphereMatSelected;
    this.nodes[day].material.needsUpdate = true;
    this.nodes[day-1].material = this.sphereMat;
    this.nodes[day-1].material.needsUpdate = true;
    $('#day').html(DATES.DayNumbers[day]);

    this.updateExpenditure();
};

Finance.prototype.previousDay = function() {
    if(--this.currentDate.day < 0) {
        this.currentDate.day = 0;
        return;
    }

    var day = this.currentDate.day;
    this.nodes[day].material = this.sphereMatSelected;
    this.nodes[day].material.needsUpdate = true;
    this.nodes[day+1].material = this.sphereMat;
    this.nodes[day+1].material.needsUpdate = true;
    $('#day').html(DATES.DayNumbers[day]);

    this.updateExpenditure();
};

Finance.prototype.updateExpenditure = function() {
    var expense = ExpenseManager.getExpense(this.currentDate);
    $('#expenditure').html(expense !== undefined ? expense.getTotal().toFixed(2) : "00.00");
};

Finance.prototype.addExpense = function() {
    $('#addForm').show();
};

Finance.prototype.addExpenseItem = function() {
    var expense = ExpenseManager.updateExpense(this.currentDate, this.currentAmount, this.currentItem, this.currentTags);
    this.updateCurrentNode(expense);
    this.updateExpenditure();
};

Finance.prototype.showExpense = function() {
    //Show item values to edit
    var expense = ExpenseManager.getExpense(this.currentDate);
    var table = document.getElementById("expenseTable");
    //Delete existing data
    var i, numRows = table.rows.length-1;
    for(i=numRows; i>=1; --i) {
        table.deleteRow(i);
    }
    var numItems = expense.priceInfo.length-1;
    var row, info;
    for(i=0; i<=numItems; ++i) {
        info = expense.priceInfo[i];
        row = table.insertRow(i+1);
        $(row).addClass("selectable");
        row.insertCell(0).innerHTML = (i+1).toString();
        row.insertCell(1).innerHTML = expense.prices[i];
        row.insertCell(2).innerHTML = info.item;
        row.insertCell(3).innerHTML = info.tags;
    }

    //this.addRowHandlers();
    $('.selectable').on("click", function() {
        $(this).addClass('selected').siblings().removeClass('selected');
        var value=$(this).find('td:first').html();
        //DEBUG
        console.log("Selected = ", value);
    });

    $('#viewForm').show();
};

Finance.prototype.addRowHandlers = function() {
    var table = document.getElementById("expenseTable");
    var rows = table.getElementsByTagName("tr");
    var i, numRows = rows.length;
    for(i = 1; i < numRows; i++) {
        var currentRow = table.rows[i];
        var createClickHandler =
            function(row)
            {
                return function() {
                    $(row).addClass("selected").siblings().removeClass('selected');
                };
            };

        currentRow.onclick = createClickHandler(currentRow);
    }
};

Finance.prototype.dismissExpense = function() {
    $('#viewForm').hide();
};

Finance.prototype.validateExpense = function() {
    var form = document.forms["addExpenseForm"];
    var amount = form["amount"].value;
    var item = form["item"].value;
    var tags = form["tags"].value;
    var amountElem = $('#inputAmount');
    var errorElem = $('#errorText');

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
};

Finance.prototype.editItem = function() {
    $('#addForm').show();
};

Finance.prototype.updateCurrentNode = function(expense) {
    var day = this.currentDate.day;
    var label = spriteManager.getSpriteByIndex((day*2)+2);
    var total = expense.getTotal();
    label.position.y = this.groundOffset + this.labelOffset + total;
    spriteManager.setTextAmount(label, total);
    this.nodes[day].position.y = this.groundOffset + total;
};

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