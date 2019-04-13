const axios = require('axios');
const htmlToJson = require('html-to-json');
const moment = require('moment');
const util = require('util');

module.exports = async function getSongHistory(playHistoryUrl) {

    let songList = [];
    let response = await axios.get(playHistoryUrl);

    // Grab all the contents of the <td> tags as an array of strings
    let filtered = await htmlToJson.parse(response.data, function () {
        return this.map('td', function ($item) {
            return $item.text();
        });
    });

    // Remove the 'current song'
    let newArray = filtered.filter(function(value, index, arr) {
        if(value != "Current Song") {
            return value;
        }
    });

    // Remove the leading items
    newArray = newArray.splice(5);
  
    // Get the date strings for yesterday and today
    let now = new Date();
    let nowTimeString = moment(now).format("HH:mm:ss");
    let yesterdayDateString = moment(now).subtract(-1, 'day').format("YYYY-MM-DD");
    let todayDateString = moment(now).format("YYYY-MM-DD");

    // Create a song object and push it into the song list
    for(let i = 0; i < 5; i++) {
        addSongToList(i, newArray, songList, nowTimeString, todayDateString, yesterdayDateString);
    }

    return songList;
};

const addSongToList = (songNumber, stringArray, songList, nowTimeString, todayDateString, yesterdayDateString) => {
    let indexOffset = songNumber * 2;

    // Make sure there are actually elements present
    if(stringArray.length > indexOffset) {
        let playDate = null;

        // Determine if the date is today or yesterday:
        if(stringArray[indexOffset] < nowTimeString) {
            playDate = todayDateString;
        } else {
            playDate = yesterdayDateString;
        }

        let fullSongTitle = stringArray[indexOffset + 1];
        let songTitleSplit = fullSongTitle.split(" by ");
        let title, album = "";
        
        // if it's not in standard `Title by Album` format, we can ignore it
        if(songTitleSplit.length < 2){
            return;
        }
        title = songTitleSplit[0];
        album = songTitleSplit[1];

        // Create a timestamp that will be stored with the song entry
        let timeStamp = moment(`${playDate} ${stringArray[indexOffset]}`).utc().toISOString();
               
        // Create the song object for this offset
        let song = {
            timestamp: timeStamp,
            date: playDate,
            startTime: stringArray[indexOffset],
            title: title,
            album: album
        };

        songList.push(song);
    }
};