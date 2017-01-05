/**
 * Created by tonyg on 12/10/2016.
 */

//Month data
var DATES = (function() {
    var monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    var dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];
    var daysPerMonth = [
        31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
    ];
    var dayNumbers = [
        "1st",
        "2nd",
        "3rd",
        "4th",
        "5th",
        "6th",
        "7th",
        "8th",
        "9th",
        "10th",
        "11th",
        "12th",
        "13th",
        "14th",
        "15th",
        "16th",
        "17th",
        "18th",
        "19th",
        "20th",
        "21st",
        "22nd",
        "23rd",
        "24th",
        "25th",
        "26th",
        "27th",
        "28th",
        "29th",
        "30th",
        "31st"
    ];

    return {
        MonthNames: monthNames,
        DayNames: dayNames,
        DayNumbers: dayNumbers
    };

})();
