// Constants for the charts
const MAP_HEIGHT = 700;
const MAP_WIDTH = 1400;

// Global for path data
let PATH_DATA;

// Global dictionaries for our data
// TODO: Add dictionaries for the other data
let ANNUAL_STATE_DATA = {};
let QUARTERLY_STATE_DATA = {};

// Dictionary for converting state names
const STATE_NAME_DICT = {"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};

// global variable to load in unique cities
let city_data = []

// Initialize the website
start();

// Setup the website & draw the map
async function start() {

    // Load in our json data
    await loadData();

    // Create an svg to hold the map
    let svg = d3.select(".map-div").append("svg")  
                                   .attr("id", "map-svg")
                                   .attr("height", MAP_HEIGHT)
                                   .attr("width", MAP_WIDTH);

    // Convert spherical coordinates to 2D cooordinates 
    let projection = d3.geoAlbersUsa()
        .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]) // this centers the map in our SVG element
        .scale([1300]); // this specifies how much to zoom
    
    // Convert the projected lat/lon coordinates into an SVG path string
    let path = d3.geoPath()
                 .projection(projection);
    
    // Create states
    let states = svg.selectAll(".state")
    states.data(PATH_DATA.features).enter()
                                   .append("path")
                                   .attr("class", "state")
                                   .attr("d", path)
                                   .attr("id", d => d.properties.name)
                                   .on("click", stateCard);
    
    // START: adding city points to map

    svg.selectAll('.city')
        .data(city_data)
        .enter()
        .append('circle')
        .attr('class', 'city')
        .attr("cx", d => projection([d.Cords[1], d.Cords[0]])[0]) // lon, lat
        .attr("cy", d => projection([d.Cords[1], d.Cords[0]])[1])
        .attr("r", 4)
        .style("fill", "red")
        // below brings up a card with the metro name
        .on("click", (event, d) => {
            const card = d3.select("#city-info-card");
            card.style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .html(`<strong>Metro:</strong> ${d.Metro_name}`);
        })
        // below does a hover for metro name
        .append("title")
        .text(d => d.Metro_name);
    
    d3.select("body").on("click", function(event) {
        const isCity = event.target.classList.contains("city");
        if (!isCity) {
            d3.select("#city-info-card").style("display", "none");
        }
    });

    //END
}

// Helper for loading in json and initializing our dictionaries
async function loadData() {

    // Populates dictionary with parsed json data, divdided by state
    let populateDictionary = (data, dictionary) => {
        data.forEach(row => {
            // Converts the abbreviated version of the state name into the full version
            stateName = STATE_NAME_DICT[row['State']];
            // If an array doesn't already exist for the given state, create one
            if (!dictionary[stateName]) { dictionary[stateName] = []; }
            // Adds the row to the dictionary
            dictionary[stateName].push(row);
        })
    }

    // Parses json data
    await d3.json("./datasets/jsonFiles/us-states.json").then(data => PATH_DATA = data);
    await d3.json("./datasets/jsonFiles/annualStateData.json").then(data => populateDictionary(data, ANNUAL_STATE_DATA));
    await d3.json("./datasets/jsonFiles/quarterlyStateData.json").then(data => populateDictionary(data, QUARTERLY_STATE_DATA));
    // TODO: Add city data parsing here

    //START: Parsing cities
    metro_data_file_path = "/datasets/jsonFiles/metro_data.json"
    await d3.json(metro_data_file_path).then(data => {
        const seen = new Set()
        city_data = data.filter(e => {
            if(!seen.has(e.Metro_name)){
                seen.add(e.Metro_name);
                return true;
            }
            return false;
        })
    })
    // console.log(city_data)
    // END
}


// PLACEHOLDER: Currently helps show functionality of code
function stateCard(event, d) { 
    curState = d.properties.name;
    alert(curState); 

    // Open console to see structure of dictionarys
    console.log('Annual State Data:\n');
    console.log(ANNUAL_STATE_DATA);

    console.log('Quarterly State Data:\n'); 
    console.log(QUARTERLY_STATE_DATA);

    // Example usage of a dictionary given a clicked state
    console.log(curState + "'s avg house price over the years:");
    ANNUAL_STATE_DATA[curState].forEach(instance => console.log(instance['Year'] + ': ' + instance['Average Price']));
}
