"use strict";
/**
 * IIFE
 */
(function () {
    let originalData =
        [
            {id: 1, start: 60, end: 150},
            {id: 2, start: 520, end: 615},
            {id: 3, start: 510, end: 570},
            {id: 4, start: 540, end: 585},
            {id: 5, start: 645, end: 705},
            {id: 6, start: 600, end: 660},
            {id: 7, start: 600, end: 660},
            {id: 8, start: 0, end: 30},
        ];


    let initializeData = initializeLeftTopAttributes(originalData);


    /**
     * the function gets array of events
     * and returns a copy of the array with additional attributes (top,left,width) for each event
     * @param data - array of events
     * @returns [] - clone array of events with additional attributes
     */
    function initializeLeftTopAttributes(data) {
        //validation
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        //cloning the data - deep copy
        let myData = JSON.parse(JSON.stringify(data));

        //checking if all the attributes of the events are set correctly
        myData = validation(myData);

        //remove duplicates events sharing the same id
        if (myData.length > 0) {
            myData = removeDuplicatesEvents(myData);
        }

        //sorting the clone data
        myData = sortData(myData);

        //separate the clone data to groups of collisions
        let groups = getGroups(myData);

        //for each group separates the events within the group to columns
        let groupsColumns = getGroupsColumns(groups);

        //for each event initialize the attributes (top, left, width)
        groupsColumns.forEach(function (group) {
            group.forEach(function (column, index) {
                column.forEach(function (event) {
                    event.top = event.start;
                    event.left = (100 / group.length) * index;
                    event.width = (100 / group.length);
                });
            });
        });

        return myData;
    }


    /**
     * checking if all the attributes of the event (id, start, end) are numeric
     * and if (start, end) are in the correct range
     * @param data - array of events
     * @returns [] - array of events after validation
     */
    function validation(data) {
        return data.filter(function (event) {
            let opt1 = typeof (event.id) === 'number';
            let opt2 = typeof(event.start) === 'number';
            let opt3 = typeof(event.end) === 'number';
            if (!opt1 || !opt2 || !opt3) {
                return false;
            }
            let opt4 = (event.start >= 0 && event.start < 720);
            let opt5 = (event.end > 0 && event.end <= 720);
            return opt4 && opt5;
        });
    }


    /**
     * remove duplicates events sharing the same id
     * @param data - array of events
     * @returns [] - array of events without duplicates events sharing the same id
     */
    function removeDuplicatesEvents(data) {
        return data.filter(function (obj, pos, arr) {
            return arr.map(function (mapObj) {
                return mapObj['id'];
            }).indexOf(obj['id']) === pos;
        });
    }


    /**
     * sort the data by start time
     * @param data - array of events
     * @returns [] - array of sorted events
     */
    function sortData(data) {
        data.sort(function (a, b) {
            return a.start - b.start
        });
        return data;
    }


    /**
     * returns all the collisions groups of a data
     * @param data - array of events
     * @returns [] - array of collisions groups
     */
    function getGroups(data) {
        let groups = [];
        let checked = [];

        data.forEach(function (event) {
            //checking if we already found the collisions group of this event
            if (checked.includes(event)) {
                return;
            }
            //getting all the events that collisions with a specific event and all the events that collisions with them
            //(recursive)
            let group = getGroup(data, [event], []);

            //adding all events to checked list
            checked = checked.concat(group);

            //adding a group of collisions to groups array
            groups.push(group);
        });
        return groups;
    }


    /**
     * similar to 'BFS' algorithm
     * getting all the events that collision with the events in the queue and all the events that collisions with them
     * (recursive)
     * @param data - array of events
     * @param queue - array of the events we need to check collisions with
     * @param group - the group of collisions events
     * @returns [] - the group of collisions events
     */
    function getGroup(data, queue, group) {
        if (queue.length === 0)
            return group;

        //FIFO
        let event = queue[0];
        queue.splice(0, 1);

        //checking if we already have the events in the group
        if (group.indexOf((event)) === -1) {
            group.push(event);
        }

        //getting all the collisions events with a specific event
        let collusions = getCollisions(data, event);

        //for each collision event, if he is't already in the group, pushing the event to the queue to check his collisions
        collusions.forEach(function (collidedElement) {
            if (!group.includes(collidedElement)) {
                queue.push(collidedElement);
            }
        });

        return getGroup(data, queue, group);
    }


    /**
     * returns all the events in data that collisions with the given event
     * @param data - array of events
     * @param event
     * @returns [] - array of collisions events with the given event
     */
    function getCollisions(data, event) {
        return data.filter(function (currentEvent) {
            if (event.id !== currentEvent.id) {
                return hasCollision(event, currentEvent);
            }
            return false;
        })
    }


    /**
     * returns 'true' if there is collisions between the two events
     * @param event1 - event
     * @param event2 - event
     * @returns boolean
     */
    function hasCollision(event1, event2) {
        return event1.start < event2.end && event1.end > event2.start;
    }


    /**
     * separate a group to columns for each group of events within our groups
     * @param groups - contains groups of events
     * @returns [] - groups of events that separated to columns
     */
    function getGroupsColumns(groups) {
        let groupsColumns = [];
        groups.forEach(function (group) {
            //separate a group of events to columns
            let groupColumns = getGroupColumns(group);
            groupsColumns.push(groupColumns);
        });
        return groupsColumns;
    }


    /**
     * separate a group of events to columns
     * @param group - groups of events
     * @returns [] - getting the given group separated to columns
     */
    function getGroupColumns(group) {
        let groupColumns = [];
        let checked = [];
        group.forEach(function (event) {
            //checking if the event already set to a column
            if (!checked.includes(event)) {
                //gets all the events that in the same column as the given event
                var sameColumn = getColumn(group, event, checked);
                //mark the events as checked
                checked = checked.concat(sameColumn);
                //add a column of events to the group of columns
                groupColumns.push(sameColumn);
            }
        });
        return groupColumns;
    }


    /**
     * getting all the events that in the same column as the given event
     * @param group - group of events
     * @param event - the specific event
     * @param checked - all the events that we already set to a column
     * @returns [] - array of events that in the same column
     */
    function getColumn(group, event, checked) {
        let column = [event];
        let current = event;
        group.forEach(function (event) {
            //checking if there is not collisions between the two events
            if (event.start >= current.end && !checked.includes(event)) {
                column.push(event);
                //set the event that we found to be the current event
                current = event;
            }
        });
        return column;
    }


    /**
     * adding all the events to the DOM
     * @param data - array of events with (top, left, width) attributes initialized
     */
    function printEvents(data) {
        data.forEach(function (event) {
            printEvent(event);
        })
    }


    /**
     * adding the event to the DOM
     * @param event
     */
    function printEvent(event) {
        let div = getDivElement(event);
        let header = document.createElement('span');
        let content = document.createElement('span');
        let hasPlaceForHeader = (event.end - event.start) > 29;
        let hasPlaceForContent = (event.end - event.start) > 44;
        header.className += " event-header";
        content.className += " event-content";
        if (hasPlaceForHeader) {
            div.appendChild(header);
        }
        if (hasPlaceForContent) {
            div.appendChild(content);
        }
        document.getElementById('container').appendChild(div);
    }


    /**
     * return a div that represent the given event
     * @param event
     */
    function getDivElement(event) {
        let div = document.createElement('div');
        div.id = event.id;
        div.style.top = event.top + 'px';
        div.style.height = (event.end - event.start) + 'px';
        div.className += " event";

        let isAlignToLeft = (event.left === 0);
        let isAlignToRight = ((100 - (event.left + event.width)) < 0.001);
        //event with is 100%
        if (event.width === 100) {
            div.style.left = '10px';
            div.style.width = 'calc(' + event.width + '% - 20px';
        } else if (isAlignToLeft) {
            div.style.left = '10px';
            div.style.width = 'calc(' + event.width + '% - 10px';
        } else {
            div.style.left = event.left + '%';
            if (isAlignToRight) {
                div.style.width = 'calc(' + event.width + '% - 10px';
            } else {
                div.style.width = event.width + '%';
            }
        }

        return div;
    }


    /**
     * invokes when the whole page is loaded including styles, images and other resources
     */
    window.onload = function () {
        printEvents(initializeData);
    };
}());