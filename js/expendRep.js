/**
 * Created by DrTone on 18/08/2017.
 */

//Representation for expenditure objects
//Constants
const DATE_LABEL = {
    X_OFFSET: 0,
    Y_OFFSET: -15,
    Z_OFFSET: 10
};
const EXPEND_LABEL = {
    X_OFFSET: 0,
    Y_OFFSET: 0,
    Z_OFFSET: 0
};
const LABEL_SCALE = new THREE.Vector3(30, 30, 1);
const EXPENSE_COLOURS = {
    DEFAULT: 0xfed600,
    SELECTED: 0xffffff,
    EMISSIVE: 0xfed600
};
const STAND_PROPERTIES = {
    RADIUS: 1,
    HEIGHT: 1,
    SCALE: 4
};
const START_POS = new THREE.Vector3(-105, 10, 0);
const X_INC = 35;
const START_WEEK_OFFSET = 7;
const WEEK_OFFSET = 7;
const BASE_OFFSET = 6;

class ExpendRepresentation {
    constructor() {
        this.daysPerMonth = 31;
        this.currentDay = 0;
        this.group = new THREE.Object3D();
        this.nodes = [];
        this.dayLabels = [];
        this.spendLabels = [];
        this.stands = [];

        //Date info
        this.currentDate = {};
        this.currentDate.day = 0;
        this.currentDate.week = 0;
        this.currentDate.month = 9;
        this.currentDate.year = 2016;
        this.daysThisMonth = DATES.daysPerMonth[this.currentDate.month];
        this.weeksThisMonth = 4;

        //Node info
        this.selectedNode = 0;
    }

    setName(name) {
        this.repName = name;
        this.group.name = name;
    }

    getCurrentDate() {
        return this.currentDate;
    }

    getCurrentDay() {
        return this.currentDate.day;
    }

    getDaysThisMonth() {
        return this.daysThisMonth;
    }

    getWeeksThisMonth() {
        return this.weeksThisMonth;
    }

    getCurrentWeek() {
        return this.currentDate.week;
    }

    getPreviousWeek() {
        return this.currentDate.previousWeek;
    }

    getCurrentMonth() {
        return this.currentDate.month;
    }

    setCurrentDay(day) {
        this.currentDate.day = day;
    }

    setCurrentWeek(week) {
        this.currentDate.week = week;
    }

    setPreviousWeek(week) {
        this.currentDate.previousWeek = week;
    }

    setCurrentMonth(month) {
        this.currentDate.month = month;
    }

    setCurrentDate(date) {
        this.currentDate = date;
    }

    generateRepresentations(repInfo) {
        //Create representations for each day
        let label;
        let pos = new THREE.Vector3();
        let dayLabelOffset = new THREE.Vector3(DATE_LABEL.X_OFFSET, DATE_LABEL.Y_OFFSET, DATE_LABEL.Z_OFFSET);
        let expendLabelOffset = new THREE.Vector3(EXPEND_LABEL.X_OFFSET, EXPEND_LABEL.Y_OFFSET, EXPEND_LABEL.Z_OFFSET);
        this.expenseMat = new THREE.MeshPhongMaterial({color: EXPENSE_COLOURS.DEFAULT});
        this.expenseMatSelected = new THREE.MeshPhongMaterial( {color: EXPENSE_COLOURS.SELECTED, emissive: EXPENSE_COLOURS.EMISSIVE} );
        let standGeom = new THREE.CylinderBufferGeometry(STAND_PROPERTIES.RADIUS, STAND_PROPERTIES.RADIUS, STAND_PROPERTIES.HEIGHT);
        let i, node, stand;
        this.nodes = [];
        this.dayLabels = [];
        this.spendLabels = [];
        this.stands = [];
        let geom = repInfo.geom;

        for(i=0; i<this.daysPerMonth; ++i) {
            node = new THREE.Mesh(geom, i===this.selectedNode ? this.expenseMatSelected : this.expenseMat);
            node.visible = false;
            node.position.set(START_POS_X+(X_INC*i), START_POS_Y, START_POS_Z);
            this.nodes.push(node);
            this.group.add(node);
            pos.copy(node.position);
            pos.add(dayLabelOffset);
            label = spriteManager.create(DATES.dayNumbers[i], pos, LABEL_SCALE, 32, 1, true, false);
            label.visible = false;
            this.group.add(label);
            this.dayLabels.push(label);
            pos.copy(node.position);
            pos.add(expendLabelOffset);
            label = spriteManager.create("£0.00", pos, LABEL_SCALE, 32, 1, true, false);
            label.visible = false;
            this.spendLabels.push(label);
            //Add stand for representation as well
            stand = new THREE.Mesh(standGeom, i===this.currentDay ? this.expenseMatSelected : this.expenseMat);
            stand.visible = false;
            stand.scale.y = STAND_SCALE;
            stand.position.set(START_POS_X+(X_INC*i), STAND_SCALE/2, START_POS_Z);
            this.stands.push(stand);
            this.group.add(stand);
            this.group.add(label);
        }

        return this.group;
    }

    updateCurrentNode(total) {
        let day = this.currentDate.day;
        this.nodes[day].position.y = START_POS.y + total;
        this.stands[day].scale.y = this.nodes[day].position.y - BASE_OFFSET;
        this.stands[day].position.y = this.stands[day].scale.y / 2;
    }

    updateGroup(offset) {
        this.group.position.x += offset;
    }

    moveGroup(position) {
        this.group.position.x = position;
    }

    selectNodes(nodeSelected, nodeDeselected) {
        this.nodes[nodeSelected].material = this.expenseMatSelected;
        this.nodes[nodeSelected].material.needsUpdate = true;
        this.nodes[nodeDeselected].material = this.expenseMat;
        this.nodes[nodeDeselected].material.needsUpdate = true;
        this.stands[nodeSelected].material = this.expenseMatSelected;
        this.stands[nodeSelected].material.needsUpdate = true;
        this.stands[nodeDeselected].material = this.expenseMat;
        this.stands[nodeDeselected].material.needsUpdate = true;

        this.selectedNode = nodeSelected;
    }

    clearSelection() {
        this.nodes[this.selectedNode].material = this.expenseMat;
        this.nodes[this.selectedNode].material.needsUpdate = true;
        this.stands[this.selectedNode].material = this.expenseMat;
        this.stands[this.selectedNode].material.needsUpdate = true;
        this.selectedNode = -1;
    }

    setSelection(node) {
        this.nodes[node].material = this.expenseMatSelected;
        this.nodes[node].material.needsUpdate = true;
        this.stands[node].material = this.expenseMatSelected;
        this.stands[node].material.needsUpdate = true;
        this.selectedNode = node;
    }

    setNodeStatus(node, status) {
        this.nodes[node].visible = status;
        this.dayLabels[node].visible = status;
        this.spendLabels[node].visible = status;
        this.stands[node].visible = status;
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
}