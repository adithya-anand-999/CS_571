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
let scaleHPI = false;

// Dictionary for converting state names
const STATE_NAME_DICT = {"DC":"District of Columbia", "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};

// Initialize global color scales
let globalPriceColorScale = null;
let globalIndexColorScale = null;

// Initialize the website
start();

// Setup the website & draw the map
async function start() {
    // Load in our json data
    await loadData();

    // Set up global scales with loaded data
    let globalPrices = []
    let globalIndexes = []
        
    Object.values(ANNUAL_STATE_DATA).forEach(state => {
        state.forEach(instance => {
            globalPrices.push(instance["Average Price"]);
            globalIndexes.push(instance["SA Index Average"]);
        });
    });
        
    globalPriceColorScale = d3.scaleLinear()
                                    .domain([d3.min(globalPrices), (d3.max(globalPrices)-d3.min(globalPrices))/2, d3.max(globalPrices)])
                                    .range(["#d7e6f7", "#194475", "#0c1263"]);
    globalIndexColorScale = d3.scaleLinear()
                                    .domain([d3.min(globalIndexes), (d3.max(globalIndexes)-d3.min(globalIndexes))/2, d3.max(globalIndexes)])
                                    .range(["#d7e6f7", "#194475", "#0c1263"]);
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
    selected.metros = [];
    selected.states = [];

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

    /*
    const yearStatePrice = Object.values(ANNUAL_STATE_DATA).map((stateData) => stateData[wantedYear]['Average Price'])
    console.log(yearStatePrice)

    const colorScale = d3.scaleLinear() //d3.select("#metric").node().value)
                      .domain([d3.min(yearStatePrice), d3.max(yearStatePrice)])
                      .range(["#d7e6f7", "#194475"]); 
    */

    // Create states
    let states = svg.selectAll(".state")
    states.data(PATH_DATA.features).enter()
                                .append("path")
                                .attr("class", "state")
                                .attr("d", path)
                                .style('fill', (d) => globalPriceColorScale(((ANNUAL_STATE_DATA[d.properties.name])[wantedYear])['Average Price']))
                                .attr("id", d => d.properties.name)
                                .on('mouseover', (event, _d) => d3.select(event.currentTarget).style("fill", "#FAC898"))
                                .on("mouseout", (event, d) => {
                                    curState = d3.select(event.currentTarget);
                                    if (!((event.currentTarget.classList).contains("selected"))) {
                                        if (scaleHPI) { curState.style("fill", globalIndexColorScale(((ANNUAL_STATE_DATA[d.properties.name])[d3.min([9, parseInt(d3.select('#year').node().value.substring(2))])])['SA Index Average'])); }
                                        else { curState.style("fill", globalPriceColorScale(((ANNUAL_STATE_DATA[d.properties.name])[d3.min([9, parseInt(d3.select('#year').node().value.substring(2))])])['Average Price'])); }
                                    }
                                    else { d3.select(event.currentTarget).style("fill", "#FAC898"); }
                                })
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
    let MARGINS = {left: 70, right: 10, top: 75, bottom: 60};
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
    .text(scaleHPI ? "Quarterly State HPI Index in " + years_list[selectedYear] : "Quarterly State Average Price in " + years_list[selectedYear]);

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
           .text(scaleHPI ? "HPI Index" : "Average Price");
        
        return;
    }
    
    // Check if using HPI values
    if (scaleHPI) {
        // If so, filter data using hpi index
        selectedStates.forEach(stateName => {
            let quarters = [1,2,3,4]
            let curState = QUARTERLY_STATE_DATA[stateName];
            let instances = []

            // Find the HPI index for each quarter of the current state
            quarters.forEach(q => {
                found = (curState.find(instance => instance["Year"] === years_list[selectedYear] && instance["Quarter"] === q));
                curIndexVal = found["SA Index"]
                // Add the value to the array of all values as well as the state specific array
                yAxisValues.push(curIndexVal);
                instances.push(found);
            });

            // Push the final filtered state data to an array that will be used to create the lines
            filteredSelectedData.push(instances);
        });
    }
    // Otherwise, filter the data using avg price
    else {
        selectedStates.forEach(stateName => {
            let quarters = [1,2,3,4]
            let curState = QUARTERLY_STATE_DATA[stateName];
            let instances = []

            // Find the HPI index for each quarter of the current state
            quarters.forEach(q => {
                let found = (curState.find(instance => instance["Year"] === years_list[selectedYear] && instance["Quarter"] === q));
                let curIndexVal = found["Average Price"]
                // Add the value to the array of all values as well as the state specific array
                yAxisValues.push(curIndexVal);
                instances.push(found);
            });

            // Push the final filtered state data to an array that will be used to create the lines
            filteredSelectedData.push(instances);     
        });

        let yScale = d3.scaleLinear().domain([d3.min(yAxisValues), d3.max(yAxisValues)]).range([HEIGHT - (MARGINS.top + MARGINS.bottom), 0]);
        let yAxis = d3.axisLeft().scale(yScale);

        // Add the y-axis to the svg
        svg.append("g")
           .attr("id", "y-axis")
           .attr("transform", "translate(" + MARGINS.left + "," + MARGINS.top + ")")
           .call(yAxis);
        svg.append("text")
           .attr("x", (0 -(HEIGHT - (MARGINS.top + MARGINS.bottom))/2) - (MARGINS.top + MARGINS.bottom) + 20)
           .attr("y", 15)
           .attr("transform", "rotate(-90)")
           .text(scaleHPI ? "HPI Index" : "Average Price");

        // Create the line generator function
        let lineGenerator = d3.line()
                              .x(d => xScale(String(d["Quarter"])))
                              .y(d => yScale(d["Average Price"]));
        
        
        console.log(selectedStates)
        // Create color scale
        let colorScale = d3.scaleOrdinal()
                           .domain(selectedStates)
                           .range(d3.schemeCategory10);

        // Create the map visualization using the path and data
        let lines = svg.append("g")
                       .attr("id", "lines")
                       .attr("transform", "translate(" + (MARGINS.left) + "," + MARGINS.top + ")");


        // Create lines for each group
        lines.selectAll(".line")
             .data(filteredSelectedData)
             .enter()
             .append("path")
             .attr("class", "line")
             .attr("stroke", (instances) => {
                return colorScale(STATE_NAME_DICT[(instances[0])["State"]]);

             })
             .attr("stroke-width", 2)
             .attr("fill", "none")
             .attr("d", (instances) => lineGenerator(instances));
                      
    }

    // Create scales
    // Create the y axis
    // Append the y axis

    // Create the lines
    
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

    // Regenerate the quarterly graph nad update the colorscale
    generateQuarterlyGraph();
    updateStateColorScale();
}

function updateStateColorScale() {
    const wantedYear = d3.min([9, parseInt(d3.select('#year').node().value.substring(2))]);

    // If the scale is set to hpi, base coloring off hpi data
    if (scaleHPI) {
        d3.selectAll(".state").each(function(d) {
            let curState = d3.select(this);
            let isSelected = curState.classed("selected");
            if (!isSelected) { curState.style("fill", globalIndexColorScale(((ANNUAL_STATE_DATA[d.properties.name])[wantedYear])['SA Index Average'])); }
        });
    }
    // Otherwise scale off average price
    else {
        d3.selectAll(".state").each(function(d) {
            let curState = d3.select(this);
            let isSelected = curState.classed("selected");
            if (!isSelected) { curState.style("fill", globalPriceColorScale(((ANNUAL_STATE_DATA[d.properties.name])[wantedYear])['Average Price'])); }
        });
    }
}

// slider
const slider = d3.select('#year');
const yearBox = d3.select('#yearBox');
slider.on('input', function(){
    yearBox.property('value', this.value);
    //generateMap();
    updateStateColorScale();
    generateQuarterlyGraph();
});