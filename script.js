let redirect_uri = "http://127.0.0.1:5500/index.html"

let client_id = "47a5f7bc78c2462e9d2a865999c42942"
let client_secret = "2f1a872c641944fca3db0cfee225899f"

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token"

localStorage.setItem("client_id", client_id)
localStorage.setItem("client_secret", client_secret)

function onPageLoad() {
    client_id = localStorage.getItem("client_id")
    client_secret = localStorage.getItem("client_secret")

    if (window.location.search.length > 0){
        handleRedirect()
    }
}

function handleRedirect() {
    let code = getCode()
    fetchAccessToken(code)
    window.history.pushState("", "", redirect_uri)
}

const getCode = () => {
    let code = null
    const queryString = window.location.search
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString)
        code = urlParams.get('code')
    }
    return code
}

const fetchAccessToken = (code) => {
    let body = "grant_type=authorization_code"
    body += "&code=" + code
    body += "&redirect_uri=" + redirect_uri
    body += "&client_id=" + client_id
    body += "&client_secret=" + client_secret
    callAuthorizationApi(body)
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
            let access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            let refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
        goToPlayer()
    }
    else {
        alert(this.responseText);
    }
}

const redirect = async () => {
    let url = AUTHORIZE
    url += "?client_id=" + client_id
    url += "&response_type=code"
    url += "&redirect_uri=" + encodeURI(redirect_uri)
    url += "&show_dialog=true"
    url += "&scope=user-read-currently-playing"

    window.location.href = url;
}

function goToPlayer() {
    window.location.href += "spotify-player/"
}

/* ---------------------------- STYLE  ----------------------------*/

const highlightText = (id) => {
    const text = document.getElementById(id)
    text.style.color = "#1DB954"
}

const removeHighlight = (id) => {
    const text = document.getElementById(id)
    text.style.color = ""
}