/**
 * Created by DrTone on 18/08/2017.
 */

//Representation for expenditure objects
//Constants
const DATE_LABEL = {
    X_OFFSET: 0,
    Y_OFFSET: -5,
    Z_OFFSET: 10
};
const EXPEND_LABEL = {
    X_OFFSET: 0,
    Y_OFFSET: 11,
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

        //Node info
        this.selectedNode = 0;
    }

    setName(name) {
        this.repName = name;
        this.group.name = name;
    }

    getCurrentDay() {
        return this.currentDay;
    }

    setCurrentDay(day) {
        this.currentDay = day;
    }

    setExpenseColour(colour) {
        this.expenseMat.color.setStyle(colour);
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
        let day = this.currentDay;
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
        this.currentDay = node;
    }

    setNodeStatus(node, status) {
        this.nodes[node].visible = status;
        this.dayLabels[node].visible = status;
        this.spendLabels[node].visible = status;
        this.stands[node].visible = status;
    }

    showAllWeeks(date, status) {
        let daysThisMonth = DATES.daysPerMonth[date.month];
        for(let i=0; i<daysThisMonth; ++i) {
            this.setNodeStatus(i, status);
        }
    }

    showWeek(date, status) {
        let start, end;

        let daysThisMonth = DATES.daysPerMonth[date.month];
        let week = date.week;
        start = START_WEEK_OFFSET * week;
        end = start + WEEK_OFFSET;
        if(end > daysThisMonth) {
            end = daysThisMonth;
        }

        for(let i=start; i<end; ++i) {
            this.setNodeStatus(i, status);
        }
    }

    setDateLabelHeight(scale) {
        for(let i=0, numLabels=this.dayLabels.length; i<numLabels; ++i) {
            this.dayLabels[i].scale.y = LABEL_SCALE.y * scale;
        }
    }

    setDateLabelWidth(scale) {
        for(let i=0, numLabels=this.dayLabels.length; i<numLabels; ++i) {
            this.dayLabels[i].scale.x = LABEL_SCALE.x * scale;
        }
    }

    setAmountLabelHeight(scale) {
        for(let i=0, numLabels=this.spendLabels.length; i<numLabels; ++i) {
            this.spendLabels[i].scale.y = LABEL_SCALE.y * scale;
        }
    }

    setAmountLabelWidth(scale) {
        for(let i=0, numLabels=this.spendLabels.length; i<numLabels; ++i) {
            this.spendLabels[i].scale.x = LABEL_SCALE.x * scale;
        }
    }

    setStandHeight(scale) {
        let newScale = STAND_SCALE * scale;
        for(let i=0, numStands=this.stands.length; i<numStands; ++i) {
            this.stands[i].scale.y = newScale;
            this.stands[i].position.y = newScale/2;
        }
    }
}
