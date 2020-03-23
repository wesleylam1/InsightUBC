/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

CampusExplorer.buildQuery = function () {
    let query = {};
    let kind;
    let tab;
    let activeTab = document.getElementsByClassName("nav-item tab active");
    if (activeTab[0].innerHTML === "Courses") {
        kind = "courses_";
        tab = document.getElementById("tab-courses").childNodes[0];
    } else {
        if (activeTab[0].innerHTML === "Rooms") {
            kind = "rooms_";
            tab = document.getElementById("tab-rooms").childNodes[0];
        }
    }
    query = where(query, kind, tab);
    query = columns(query, kind, tab);
    query = order(query, kind, tab);
    query = groups(query, kind, tab);
    query = apply(query, kind, tab);
    return query;

    function conditions(query, kind, tab) {
        let conditions = tab.getElementsByClassName("control-group condition");
        let conditionArray = [];
        for (let cond of conditions) {
            let condition_operator = "";
            let control_not = cond.getElementsByClassName("control not")[0];
            let not = control_not.getElementsByTagName("input")[0].checked;
            let control_operators = cond.getElementsByClassName("control operators")[0];
            let operators = control_operators.getElementsByTagName("option");
            for (let operator of operators) {
                if (operator.selected) {
                    condition_operator = operator.getAttribute("value");
                }
            }
            let control_fields = cond.getElementsByClassName("control fields")[0];
            let condition_option = "";
            let options = control_fields.getElementsByTagName("option");
            for (let option of options) {
                if (option.selected) {
                    condition_option = option.getAttribute("value");
                }
            }
            let control_term = cond.getElementsByClassName("control term")[0];
            let condition_term = control_term.getElementsByTagName("input")[0].value;
            if (condition_operator !== "IS") {
                condition_term = Number(condition_term);
            }
            let condition = {};
            let condition_key = kind + condition_option;
            condition[condition_key] = condition_term;
            let condition2 = {};
            if (not) {
                condition2["NOT"] = {};
                condition2["NOT"][condition_operator] = {};
                condition2["NOT"][condition_operator] = condition;
            } else {
                condition2[condition_operator] = {};
                condition2[condition_operator] = condition;
            }
            conditionArray.push(condition2);
        }
        return conditionArray;
    }

    function where(query, kind, tab) {
        query["WHERE"] = {};
        let operators = tab.getElementsByClassName("control-group condition-type")[0];
        let div = operators.getElementsByTagName("div");
        let op = null;
        let operation = null;
        for (let child of div) {
            let input = child.getElementsByTagName("input")[0];
            if (input.checked) {
                op = input.getAttribute("value");
            }
        }
        let condition = conditions(query, kind, tab);
        if (op == "all") {
            operation = "AND";
        } else {
            if (op == "any") {
                operation = "OR";
            } else {
                query["WHERE"]["NOT"] = {};
                query["WHERE"]["NOT"]["OR"] = [];
                query["WHERE"]["NOT"]["OR"] = condition;
            }
        }
        if (condition.length === 1) {
            query["WHERE"] = condition[0];
        } else {
            if (operation !== null && condition.length >= 1) {
                query["WHERE"][operation] = [];
                query["WHERE"][operation] = condition;
            }
        }
        return query;
    }

    function columns(query, kind, tab) {
        query["OPTIONS"] = {};
        query["OPTIONS"]["COLUMNS"] = [];
        let formColumns = tab.getElementsByClassName("form-group columns")[0];
        let fields = formColumns.getElementsByClassName("control field");
        for (let field of fields) {
            let col = field.getElementsByTagName("input")[0];
            if (col.checked) {
                let column;
                if (col.class === "transformation") {
                    column = col.value;
                } else {
                    column = kind + col.value;
                }
                query["OPTIONS"]["COLUMNS"].push(column);
            }
        }
        let transformations = formColumns.getElementsByClassName("control transformation");
        for (let transformation of transformations) {
            let col = transformation.getElementsByTagName("input")[0];
            if (col.checked) {
                let column = col.value;
                query["OPTIONS"]["COLUMNS"].push(column);
            }
        }
        return query;
    }

    function order(query, kind, tab) {
        let fields = [];
        let order = false;
        let formOrder = tab.getElementsByClassName("form-group order")[0];
        let options = formOrder.getElementsByTagName("option");
        for (let option of options) {
            if (option.selected) {
                order = true;
                let field = option.getAttribute("value");
                if (option.className === "transformation") {
                    fields.push(field);
                } else {
                    fields.push(kind + field);
                }
            }
        }
        let descending = formOrder.getElementsByClassName("control descending")[0];
        let checked = descending.getElementsByTagName("input")[0].checked;
        if (checked){
            query["OPTIONS"]["ORDER"] = {};
            query["OPTIONS"]["ORDER"].dir = "DOWN";
            query["OPTIONS"]["ORDER"].keys = fields;
        } else {
            if (order) {
                query["OPTIONS"]["ORDER"] = {};
                query["OPTIONS"]["ORDER"].dir = "UP";
                query["OPTIONS"]["ORDER"].keys = fields;
            }
        }
        return query;
    }

    function groups(query, kind, tab) {
        let formGroups = tab.getElementsByClassName("form-group groups")[0];
        let fields = formGroups.getElementsByClassName("control field");
        for (let field of fields) {
            let column = field.getElementsByTagName("input")[0];
            if (column.checked) {
                if (!query["TRANSFORMATIONS"]) {
                    query["TRANSFORMATIONS"] = {};
                    query["TRANSFORMATIONS"]["GROUP"] = [];
                }
                query["TRANSFORMATIONS"]["GROUP"].push(kind + column.value);
            }
        }
        return query;
    }

    function apply(query, kind, tab) {
        let transformations = tab.getElementsByClassName("control-group transformation");
        if (!query["TRANSFORMATIONS"] && transformations.length > 0) {
            query["TRANSFORMATIONS"] = {};
            query["TRANSFORMATIONS"]["GROUP"] = [];
            query["TRANSFORMATIONS"]["APPLY"] = [];
        } else {
            if (query["TRANSFORMATIONS"]) {
                query["TRANSFORMATIONS"]["APPLY"] = [];
            }
        }
        for (let trans of transformations) {
            let trans_operator;
            let trans_option;
            let control_term = trans.getElementsByClassName("control term")[0];
            let term = control_term.getElementsByTagName("input")[0].value;
            let control_operators = trans.getElementsByClassName("control operators")[0];
            let operators = control_operators.getElementsByTagName("option");
            for (let operator of operators) {
                if (operator.selected) {
                    trans_operator = operator.getAttribute("value");
                }
            }
            let control_fields = trans.getElementsByClassName("control fields")[0];
            let options = control_fields.getElementsByTagName("option");
            for (let option of options) {
                if (option.selected) {
                    trans_option = option.getAttribute("value");
                }
            }
            let transform = {};
            let value = kind + trans_option;
            transform[trans_operator] = value;
            let transformation = {};
            transformation[term] = transform;
            query["TRANSFORMATIONS"]["APPLY"].push(transformation);
        }
        return query;
    }
};
