// Constants for the charts
const MAP_HEIGHT = 620;
const MAP_WIDTH = 900;

// Global for path data
let PATH_DATA;

// Global dictionaries for our data
let ANNUAL_STATE_DATA = {};
let QUARTERLY_STATE_DATA = {};
let city_data = [];

// Global for list of selected states
let selected = {metros: [], states: []};
let years_list = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010];

// Global to show if scale is HPI or Avg Price
let use_HPI = false;

// Dictionary for converting state names
const STATE_NAME_DICT = {"DC":"District of Columbia", "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};

// Initialize the website
start();

// Setup the website & draw the map
async function start() {
    // Load in our json data
    await loadData();
    generateMap();
    generateQuarterlyGraph(); 
    
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

    //Parsing cities
    metro_data_file_path = "./datasets/jsonFiles/metro_data.json"
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
}

function generateMap(){
    // remove previous on each refresh
    d3.select('svg').remove();

    // Create an svg to hold the map
        let svg = d3.select(".map-div").append("svg")  
                                       .attr("id", "map-svg")
                                       .attr("height", MAP_HEIGHT)
                                       .attr("width", MAP_WIDTH);

     // Convert spherical coordinates to 2D cooordinates 
     let projection = d3.geoAlbersUsa()
     .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]) // this centers the map in our SVG element
     .scale([1200]); // this specifies how much to zoom

    // Convert the projected lat/lon coordinates into an SVG path string
    let path = d3.geoPath()
              .projection(projection);

    const wantedYear = d3.min([9, parseInt(d3.select('#year').node().value.substring(2))])

    const yearStatePrice = Object.values(ANNUAL_STATE_DATA).map((stateData) => stateData[wantedYear]['Average Price'])
    console.log(yearStatePrice)

    const colorScale = d3.scaleLinear() //d3.select("#metric").node().value)
                      .domain([d3.min(yearStatePrice), d3.max(yearStatePrice)])
                      .range(["#d7e6f7", "#194475"]); 

    // Create states
    let states = svg.selectAll(".state")
    states.data(PATH_DATA.features).enter()
                                .append("path")
                                .attr("class", "state")
                                .attr("d", path)
                                .style('fill', (d) => colorScale(((ANNUAL_STATE_DATA[d.properties.name])[wantedYear])['Average Price']))
                                .attr("id", d => d.properties.name)
                                .on('mouseover', (event, _d) => d3.select(event.currentTarget).style("fill", "#FAC898"))
                                .on("mouseout", (event, d) => !((event.currentTarget.classList).contains("selected")) ? d3.select(event.currentTarget).style("fill", colorScale(((ANNUAL_STATE_DATA[d.properties.name])[wantedYear])['Average Price'])) : d3.select(event.currentTarget).style("fill", "#FAC898"))
                                .on("click", selectState);

    //adding city points to map
    svg.selectAll('.city')
        .data(city_data)
        .enter()
        .append('circle')
        .attr('class', 'city')
        .attr("cx", d => projection([d.Cords[1], d.Cords[0]])[0]) // lon, lat
        .attr("cy", d => projection([d.Cords[1], d.Cords[0]])[1])
        .attr("r", 4)
        .style("fill", "#ff6700")
        // below brings up a card with the metro name
        .on("click", (event, d) => {
            const card = d3.select("#city-info-card");
            card.style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .html(`<strong>Metro:</strong> ${d.Metro_name}`);
            selectMetro(event,d);
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
}

function generateQuarterlyGraph(){
    // Define svg dimensions
    let HEIGHT = 350;
    let WIDTH = 500;
    let MARGINS = {left: 50, right: 10, top: 75, bottom: 60};
    let selectedYear = d3.min([9, parseInt(d3.select('#year').node().value.substring(2))]);
    let selectedMetros = selected.metros;
    let selectedStates = selected.states;
    let filteredSelectedData = [];
    let yAxisValues = [];

    // Select the right svg and remove previous data
    let svg = d3.select("#quarterly-graph");
    console.log(svg.node())
    svg.selectAll("*").remove();

    // Append the x-axis (since it doesn't change)
    let xAxisLabels = ["1", "2", "3", "4"]
    let xScale = d3.scalePoint().domain(xAxisLabels).range([0, WIDTH - MARGINS.left - MARGINS.right]);
    let xAxis = d3.axisBottom().scale(xScale);

    svg.append("g")
    .attr("id", "x-axis")
    .attr("transform", "translate(" + MARGINS.left + "," + (HEIGHT - MARGINS.bottom) + ")")
    .call(xAxis);

    svg.append("text")
    .attr("x", ((WIDTH - MARGINS.left - MARGINS.right)/2) + 20)
    .attr("y", HEIGHT - 30)
    .text("Quarter");

    svg.append("text")
    .attr("x", ((WIDTH - MARGINS.left - MARGINS.right)/2) - MARGINS.right - MARGINS.left)
    .attr("y", 65)
    .text(use_HPI ? "Quarterly State HPI Index in " + years_list[selectedYear] : "Quarterly State Average Price in " + years_list[selectedYear]);

    // Check if anything nothing is selected
    if ((selected.metros.length === 0) && (selected.states.length === 0)){

        // Generate a blank y-axis
        let yScale = d3.scaleLinear().domain([0, 0]).range([HEIGHT - (MARGINS.top + MARGINS.bottom), 0]);
        let yAxis = d3.axisLeft().scale(yScale).ticks(0);

        // Add the y-axis to the svg
        svg.append("g")
           .attr("id", "y-axis")
           .attr("transform", "translate(" + MARGINS.left + "," + MARGINS.top + ")")
           .call(yAxis);
        svg.append("text")
           .attr("x", (0 -(HEIGHT - (MARGINS.top + MARGINS.bottom))/2) - (MARGINS.top + MARGINS.bottom) + 20)
           .attr("y", 15)
           .attr("transform", "rotate(-90)")
           .text(use_HPI ? "HPI Index" : "Average Price");
        
        return;
    }

    console.log(QUARTERLY_STATE_DATA);
    // Iterate through the selected states
    selectedStates.forEach(stateName => {
        let quarters = [1,2,3,4]
        let curState = QUARTERLY_STATE_DATA[stateName];
        let yValues = []

        // Find the HPI index for each quarter of the current state
        quarters.forEach(q => {
            curIndex = (curState.find(instance => instance["Year"] === selectedYear && instance["Quarter"] === q))["SA_Index"];
            // Add the value to the array of all values as well as the state specific array
            yAxisValues.push(curIndex);
            yValues.push(curIndex);
        });

        // Push the final filtered state data to an array that will be used to create the lines
        filteredSelectedData.push({name: stateName, indexes: yValues});
    });
    

    console.log(QUARTERLY_STATE_DATA);
    // Check if using HPI values
    if (use_HPI) {
        // If so, filter data using hpi index

    }
    // Otherwise, filter the data using avg price
    else {

    }

    // Create scales
    // Create the y axis
    // Append the y axis
    // Create the line generator function
    // Create the lines

     /*
    alert("clicked");
    curState = d.properties.name;

    // Open console to see structure of dictionaries
    console.log('Annual State Data:\n');
    console.log(ANNUAL_STATE_DATA);

    console.log('Quarterly State Data:\n'); 
    console.log(QUARTERLY_STATE_DATA);

    // Example usage of a dictionary given a clicked state
    console.log(curState + "'s avg house price over the years:");
    ANNUAL_STATE_DATA[curState].forEach(instance => console.log(instance['Year'] + ': ' + instance['Average Price']));
    */
    
}

function selectMetro(event, d) {
    // If the metro was already selected, remove it
    if ((selected.metros).includes(d.Metro_name)) {
        let index = (selected.metros).indexOf(d.Metro_name);
        (selected.metros).splice(index, 1);
    }
    // Otherwise, add it
    else { (selected.metros).push(d.Metro_name); }

    // Regenerate the quarterly graph
    generateQuarterlyGraph();
}

// PLACEHOLDER: Currently helps show functionality of code
function selectState(event, d) { 
    console.log(event)
    // If the metro was already selected, remove it
    if ((selected.states).includes(d.properties.name)) {
        let index = (selected.states).indexOf(d.properties.name);
        (selected.states).splice(index, 1);
        event.currentTarget.classList.remove("selected");
    }
    // Otherwise, add it
    else {
        (selected.states).push(d.properties.name);
        event.currentTarget.classList.add("selected");
    }

    // Regenerate the quarterly graph
    generateQuarterlyGraph();
}

// slider
const slider = d3.select('#year');
const yearBox = d3.select('#yearBox');
slider.on('input', function(){
    yearBox.property('value', this.value);
    generateMap();
    generateQuarterlyGraph();
});