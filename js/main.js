$(document).ready(function () {
    "use strict";
    //Displaying the Weather Forecast Initially Displayed on the Webpage
    updateWeather(-98.4916, 29.4252);

    //Function to Update the Weather on the Webpage
    function updateWeather(longitude, latitude) {
        //Ajax Request for 5 Day Forecast
        let getFiveDayForecast = $.get("https://api.openweathermap.org/data/2.5/onecall", {
            APPID: OPEN_WEATHER_APPID,
            lat: latitude,
            lon: longitude,
            units: "imperial",
            exclude: "minutely,hourly,alerts"
        });

        //Making 5 Day Forecast Cards
        getFiveDayForecast.done(function (weatherConditions) {
            let daily = weatherConditions.daily;
            let current = weatherConditions.current;

            //Today's Date
            $("#current-date").html(getDate(daily[0]));

            //Today's Weather
            $("#current-high").html(`${Math.round(daily[0].temp.max)}º`);
            $("#current-low").html(`${Math.round(daily[0].temp.min)}º`);
            $("#current-wind").html(`${Math.round(current.wind_speed)} mph`);
            $("#current-sunrise").html(getTime(current.sunrise));
            $(".current-temperature-value").html(`${Math.round(current.temp)}º`);
            $(".current-temperature-description").html(current.weather[0].description);
            $("#current-humidity").html(`${current.humidity}%`);
            $("#current-sunset").html(`${getTime(current.sunset)}`);
            $(".current-temperature-icon-container").html(`<img src='http://openweathermap.org/img/w/${current.weather[0].icon}.png' alt='${current.weather[0].description} image'>`);

            //Clearing Weather Card Container Each Time the Location is Changed
            $(".weather-card-container").html("");

            for (let i = 1; i < 6; i++) {
                makeCard(daily[i]);
            }
        });
    }

    //Function to Get Date
    function getDate(weatherConditions) {
        //Converting the Time Stamp Date to a Human Readable Date
        let unixTimeStamp = weatherConditions.dt;
        let milliseconds = unixTimeStamp * 1000;
        let dateObject = new Date(milliseconds);
        let humanDateFormat = {
            weekday: "long", month: "long", day: "numeric"
        }
        return dateObject.toLocaleString("en-US", humanDateFormat);
    }

    //Function to Get Day of The Week Date Shortened AND Without Commas and Year
    function getDayOfTheWeek(weatherConditions) {
        //Converting the Time Stamp Date to a Human Readable Day of The Week
        const unixTimeStamp = weatherConditions.dt;
        const milliseconds = unixTimeStamp * 1000;
        const dateObject = new Date(milliseconds);
        const dateString = dateObject.toDateString();
        let date = dateString.split(' ');
        date = date[0] + " " + date[1] + " " + date[2];

        return date;
    }

    //Function to Get Time
    function getTime(weatherConditions) {
        let date = new Date(weatherConditions * 1000);

        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    //Function to Make a Forecast Card
    function makeCard(weatherConditions) {
        let weatherCard = "";
        let date = getDayOfTheWeek(weatherConditions);

        //Creating the Forecast Card
        weatherCard +=
            `<div class='d-inline-block card-div'>
                <div class='card weather-card ml-2 mr-2 mb-3 mb-lg-5 shadow rounded text-center'>
                    <div class='card-body mt-0 mb-1 p-0 text-center'>
                        <h5 class='card-title text-center date pt-2'>${date}</h5>
                        <p class='temperature'><strong>${Math.round(weatherConditions.temp.max)}º | ${Math.round(weatherConditions.temp.min)}º</strong><br>
                               <img src='http://openweathermap.org/img/w/${weatherConditions.weather[0].icon}.png' alt='${weatherConditions.weather[0].description} image'>
                        </p>
                        <p class='weather-description pb-2'><strong>${weatherConditions.weather[0].description}</strong></p>
                        <p>     
                            <strong>Humidity:</strong> ${weatherConditions.humidity}%<br>
                            <strong>Wind:</strong> ${Math.round(weatherConditions.wind_speed)} mph<br>
                            <strong>Sunrise:</strong> ${getTime(weatherConditions.sunrise)}<br>
                            <strong>Sunset:</strong> ${getTime(weatherConditions.sunset)}
                        </p>
                    </div>
                </div>
            </div>`;

        //Adding the Forecast Card to the div with a class of weather-card-container
        $(".weather-card-container").append(weatherCard);
    }

    /*************** Mapbox JS *****************/

    //Mapbox Token
    mapboxgl.accessToken = mapboxToken;

    //Customizing the Map
    let mapOptions = {
        container: 'map',
        style: 'mapbox://styles/elviravaladez/cklj3z6n50k6317qk01o809g1',
        center: [-98.4916, 29.4252], // starting position [lng, lat]
        zoom: 12 // starting zoom
    }

    //Creating the Map
    let map = new mapboxgl.Map(mapOptions);

    //Customizing the Marker
    let markerOptions = {
        color: "#ff0000",
        draggable: true
    };

    //Creating the Marker
    let marker = new mapboxgl.Marker(markerOptions)
        .setLngLat([-98.4916, 29.4252])
        .addTo(map);

    //Function to Get Coordinates of the Draggable Marker and Use Those Coordinates Within the updateWeather Function
    function onDragEnd() {
        let lngLat = marker.getLngLat();
        updateWeather(lngLat.lng, lngLat.lat);
        reverseGeocode({lng: lngLat.lng, lat: lngLat.lat}, mapboxToken).then(function (data) {
            $('#city').html(data);
        });
    }

    marker.on('dragend', onDragEnd);

    function toggleDarkMode() {
        const darkModeCheck = $('#darkModeSwitch:checked');
        const element = document.body;
        element.classList.toggle("dark-mode");
        if (darkModeCheck.length === 1)
            map.setStyle("mapbox://styles/elviravaladez/ckj64zj1w3mw719ld92pjhli0");
        else
            map.setStyle("mapbox://styles/elviravaladez/cklj3z6n50k6317qk01o809g1");
    }

    $('#darkModeSwitch').on('click', toggleDarkMode);

    // Adding a Mapbox text input to search by location and have the forecast update when a new location is searched
    let geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    });

    document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

    //Updating the marker's position to the new search result
    geocoder.on("result", function (result) {
        marker.remove();
        geocoder.clear();
        let long = result.result.geometry.coordinates[0];
        let lat = result.result.geometry.coordinates[1];
        marker = new mapboxgl.Marker(markerOptions)
            .setLngLat([long, lat])
            .addTo(map);
        marker.on('dragend', onDragEnd);

        reverseGeocode({lng: long, lat: lat}, mapboxToken).then(function (data) {
            $('#city').html(data);
        });

        updateWeather(long, lat);
    });

    //Updating the location in the Navbar
    function reverseGeocode(coordinates, token) {
        let baseUrl = 'https://api.mapbox.com';
        let endPoint = '/geocoding/v5/mapbox.places/';
        return fetch(baseUrl + endPoint + coordinates.lng + "," + coordinates.lat + '.json' + "?" + 'access_token=' + token)
            .then(function (res) {
                return res.json();
            })
            // to get all the data from the request (lines below)
            .then(function (data) {
                return data.features[2].place_name;
            });
    }
});