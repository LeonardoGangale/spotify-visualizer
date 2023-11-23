const TOKEN = "https://accounts.spotify.com/api/token"
let spotifyURI = ""
let spotifyID = ""

const alertText = document.getElementById("alert-text")
const spotifyLogo = document.getElementById("spotify-logo")
const image = document.getElementById("track-image")
const body = document.getElementsByTagName("body")[0]
const playerContainer = document.getElementsByClassName("player-container")[0];
const trackTitle =  document.getElementById("track-title");
const artistsNames = document.getElementById("artists-names")
const likedIconOutline = document.getElementById("svg-like-outline")
const likedIconFilled = document.getElementById("svg-like-filled")
let liked = false
let methodLikeSong = ""

let artistsNamesColor = "#ffffff00"

function onPageLoad() {
    window.client_id = localStorage.getItem("client_id")
    window.client_secret = localStorage.getItem("client_secret")
    window.authorization_code = localStorage.getItem("access_token")
    if(window.authorization_code === null){
        window.location = window.location.href.replace("/spotify-player/", "")
    }
}

async function makeRequest(){
    let response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
            "Authorization": "Bearer " + authorization_code,
        }}).then((response) => {
            if(response.status === 204){
                body.style.background = "white";
                alertText.style.display = "block";
                playerContainer.style.display = "none";
            } else {
                response.json().then(
                    (data) => { 
                        if(response.status === 401){
                            refreshAccessToken();
                        }
                        // style
                        alertText.style.display = "none";
                        playerContainer.style.display = "flex";
                        
                        spotifyURI = data.item.uri;
                        spotifyID = spotifyURI.slice(14)

                        setTrackImage(data.item.album.images[0].url); 
                        setTrackTitle(data.item.name, data.item.external_urls.spotify);
                        setArtists(data.item.artists);
                        setProgressbarWidth(data.progress_ms, data.item.duration_ms);
                    }
                );
            }
        })

    liked = await checkIsLiked()
    if (spotifyID !== ""){
        if (liked){
            methodLikeSong = "DELETE";
            likedIconOutline.style.display = "none"
            likedIconFilled.style.display = "block"
        } else{
            methodLikeSong = "PUT";
            likedIconOutline.style.display = "block"
            likedIconFilled.style.display = "none"
        }
    } 
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        alert(this.responseText);
    }
}

function setTrackImage (imagePath) {
    image.src = imagePath

    let downloadedImage = new Image();
    downloadedImage.crossOrigin = "anonymous"
    downloadedImage.src = imagePath;
    downloadedImage.addEventListener("load", () => {
        let RGB = getAverageRGB(downloadedImage)
        body.style.background = `linear-gradient(90deg, rgb(${RGB.red1}, ${RGB.green1}, ${RGB.blue1}), rgb(${RGB.avgRed}, ${RGB.avgGreen}, ${RGB.avgBlue}), rgb(${RGB.red2}, ${RGB.green2}, ${RGB.blue2}))`
       
        if((RGB.avgRed + RGB.avgGreen + RGB.avgBlue)/3 < 10){
            playerContainer.style.background = `rgb(10, 10, 10, 1)`;    
        }else{
            playerContainer.style.background = `rgb(${RGB.avgRed}, ${RGB.avgGreen}, ${RGB.avgBlue}, 1)`;
        }
        
        if((RGB.avgRed + RGB.avgGreen + RGB.avgBlue)/3 > 150){
            trackTitle.style.color = "black";
            artistsNamesColor = "black";
            spotifyLogo.src = "Spotify_Logo_RGB_Black.png"
        } else {
            trackTitle.style.color = "white";
            artistsNamesColor = "white"
            spotifyLogo.src = "Spotify_Logo_RGB_White.png";
        }
    });
}


function calculateAverageRGB(imageData) {
    let totalRed = 0;
    let totalGreen = 0;
    let totalBlue = 0;

    let maxRed = 0;
    let maxBlue = 0;
    let maxGreen = 0;
    let maxTreshold = 140;

    let minRed = 255;
    let minBlue = 255;
    let minGreen = 255;
    let minThreshold = 0;

    for (let i = 0; i < imageData.data.length; i += 1024) {
        if (imageData.data[i] > maxRed && imageData.data[i] < maxTreshold){
            maxRed = imageData.data[i];
        } else if (imageData.data[i] < minRed && imageData.data[i] > minThreshold){
            minRed = imageData.data[i];
        }

        if (imageData.data[i+1] > maxGreen && imageData.data[i+1] < maxTreshold){
            maxGreen = imageData.data[i+1];
        }else if (imageData.data[i+1] < minGreen && imageData.data[i+1] > minThreshold){
            minGreen = imageData.data[i+1];
        }

        if (imageData.data[i+2] > maxBlue && imageData.data[i+2] < maxTreshold){
            maxBlue = imageData.data[i+2];
        } else if (imageData.data[i+2] < minBlue && imageData.data[i+2] > minThreshold){
            minBlue = imageData.data[i+2];
        }

        totalRed += imageData.data[i];
        totalGreen += imageData.data[i + 1];
        totalBlue += imageData.data[i + 2];
    }

    const pixelCount = imageData.data.length / 1024;
    const averageRed = totalRed / pixelCount;
    const averageGreen = totalGreen / pixelCount;
    const averageBlue = totalBlue / pixelCount;

    if((averageBlue + averageGreen + averageRed)/3 < 10){
        minRed = maxRed;
        minGreen = maxGreen;
        minBlue = maxBlue;
    }

    return {
      red1: maxRed,
      green1: maxGreen,
      blue1: maxBlue,
      
      red2: minRed,
      green2: minGreen,
      blue2: minBlue,

      avgRed: averageRed,
      avgGreen: averageGreen,
      avgBlue: averageBlue,
    };
}

function getAverageRGB(image) {
    const imageElement = image;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');


    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    context.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height);

    const imageData = context.getImageData(0, 0, imageElement.width, imageElement.height);
    return calculateAverageRGB(imageData);
};

function setTrackTitle (title, linkToTrack) {
    trackTitle.innerHTML = title
    trackTitle.href = linkToTrack
}

function setArtists(namesObject){
    while(artistsNames.firstChild) {
        artistsNames.removeChild(artistsNames.firstChild)
    }
    
    let counter = 0
    namesObject.forEach(element => {
    
        let link = document.createElement("a")
        link.style.cssText = "color: " + artistsNamesColor + "; font-size: 25px; font-family: 'Circular'; text-decoration: none"

        link.addEventListener('mouseenter', () => {
            link.style.textDecoration = "underline"
            link.style.textDecorationColor = artistsNamesColor
        })
    
        link.addEventListener('mouseleave', () => {
            link.style.textDecoration = "none"
        })


        let name = document.createElement("p")
        name.style.cssText = "color: 'black'; margin: 0"
        
        name.innerHTML = element.name
        if(namesObject.length > 1  && counter < namesObject.length - 1 ){
            name.innerHTML += ",&nbsp"
        }

        
        link.href = element.external_urls.spotify
        link.target = "_blank"
    
        link.appendChild(name)
        artistsNames.appendChild(link)
        
        counter ++
    })
}

function convertMillisecond(value){
    let result = ""
    let minutes = Math.floor(value/60000)
    let seconds = Math.floor((value - minutes * 60000) / 1000)
    if (seconds < 10){
        result = `${minutes} : 0${seconds}`
    } else {
        result = `${minutes} : ${seconds}`
    }

    return result
}

const progressBar = document.getElementById("progress-foreground")
const durationText =  document.getElementById("dt-text")
const progressText =  document.getElementById("pg-text")

function setProgressbarWidth(progress, duration){
    progressBar.style.width = `${progress / duration * 100}%`
    durationText.innerHTML =  convertMillisecond(duration)
    progressText.innerHTML = convertMillisecond(progress)
}

async function checkIsLiked(){
    let url = "https://api.spotify.com/v1/me/tracks/contains?ids=";
    url += spotifyID;
    let response = await fetch(url, {
        headers: {"Content-Type": "application/json",
                "Authorization": "Bearer " + authorization_code},
        method: "GET"
    })

    let data = await response.json();
    return data[0];
}

async function likeSong(){
    let url = "https://api.spotify.com/v1/me/tracks?ids=";
    url += spotifyID;

    let response = await fetch(url, {
        headers: {"Content-Type": "application/json",
                "Authorization": "Bearer " + authorization_code},
        method: methodLikeSong,
        body: [spotifyID]
    })
}

// async function changeVolume(){
//     let url = "https://api.spotify.com/v1/me/player/volume?";
//     url += "volume_percent=50";

//     let response = fetch(url, {
//         headers: {"Content-Type": "application/json",
//                 "Authorization": "Bearer " + authorization_code},
//         method: "PUT"})
// }

setInterval(async () => {makeRequest()}, 1000)