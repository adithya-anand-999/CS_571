// Constants for the charts
const MAP_HEIGHT = 620;
const MAP_WIDTH = 900;

// Global for path data
let PATH_DATA;

// Global dictionaries for our data
let ANNUAL_STATE_DATA = {};
let QUARTERLY_STATE_DATA = {};
let US_DATA = [];
let city_data = [];

// Global for list of selected states
let selected = {metros: [], states: []};
let years_list = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010];

// Dictionary for converting state names
const STATE_NAME_DICT = {"DC":"District of Columbia", "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};

// Initialize global color scales
let globalPriceColorScale = null;
let globalPriceMin = null;
let globalPriceMax = null;
let globalIndexColorScale = null;
let globalIndexMin = null;
let globalIndexMax = null;


// Globals to track user preferences
let citiesVisible = true; // True = show cities, False = don't show cities
let scaleHPI     = false; // True = user selected HPI scale, False = user selected dollar scale
let medianStatic = true; // True = user selected median for the static graph, False = user selected average price

d3.select('#toggle-cities').on('click', () => {
    citiesVisible = !citiesVisible;
    d3.selectAll('.city').style('display', citiesVisible ? 'block' : 'none');
    d3.select('#toggle-cities').text(citiesVisible ? 'Hide Cities' : 'Show Cities');
});
  
d3.select('#toggle-scale').on('click', () => {
    scaleHPI = !scaleHPI;
    d3.select('#toggle-scale').text(scaleHPI ? 'Scale: HPI' : 'Scale: Dollar');

    // Update the map coloring, legend, and graphs
    updateStateColorScale();
    generateQuarterlyGraph();
    generateLegend();
    generate10YearGraph();
});

d3.select('#toggle-static-graph').on('click', () => {
    medianStatic = !medianStatic;
    d3.select('#toggle-static-graph').text(medianStatic ? 'Graph: Median' : 'Graph: Average' );
    generate10YearGraph();
});

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

    globalIndexMin = d3.min(globalIndexes);
    globalIndexMax = d3.max(globalIndexes);
    globalPriceMin = d3.min(globalPrices);
    globalPriceMax = d3.max(globalPrices);
        
    globalPriceColorScale = d3.scaleLinear()
                                    .domain([globalPriceMin, (globalPriceMax-globalPriceMin)/2, globalPriceMax])
                                    .range(["#d7e6f7", "#194475", "#0c1263"]);
    globalIndexColorScale = d3.scaleLinear()
                                    .domain([globalIndexMin, globalIndexMax])
                                    .range(["#d7e6f7", "#194475"]);
    generateMap();
    generateQuarterlyGraph(); 
    generateLegend();
    generate10YearGraph();
    
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
    await d3.json("./datasets/jsonFiles/fullCountryData.json").then(data => data.forEach(row => US_DATA.push(row)));

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

    const wantedYear = d3.min([9, parseInt(d3.select('#year').node().value.substring(2))]);

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
        .on("mouseover", function (event, d) {
            d3.select(this)
              .transition()
              .duration(75)
              .attr("r", 5); 
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
              .transition()
              .duration(75)
              .attr("r", 4);
            d3.select("#city-info-card")
              .transition()
              .duration(400)
              .style("opacity", 0); 
        })
        // below brings up a card with the metro name
        .on("click", (event, d) => {
            console.log(d);
            const card = d3.select("#city-info-card");
            card.style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .html(`<strong>Metro:</strong> ${d.Metro_name}<br><strong>HPI:</strong> ${d.HPI_SA}`)
                .style("opacity", 100);
            selectMetro(event,d);
        })
        // below does a hover for metro name
        .append("title")
        .text(d => d.Metro_name);
    /*
    d3.select("body").on("click", function(event) {
        const isCity = event.target.classList.contains("city");
        if (!isCity) {
            d3.select("#city-info-card").style("display", "none");
        }
    });
    */
}

function generateLegend() {
    // Clear previous version
    d3.select("#legend").selectAll("svg").remove();
    d3.select("#scale").selectAll("svg").remove();

    // creates the legend
    const legend = d3.select('#legend')
                     .append('svg')
                     .attr("height", 50)
    let min = null;
    let max = null;
    
    // dot
    const dotGroup = legend.append('g')

    dotGroup.attr('transform', `translate(0, 12)`)

    dotGroup.append("circle")
          .attr("cx", 5)
          .attr("cy", 5)
          .attr("r", 5)
          .attr("fill", "#ff6700")

    dotGroup.append('text')
          .attr("x", 20)     
          .attr("y", 5)    
          .text("Metropolitan Area")
          .style("font-size", "16px")
          .attr("alignment-baseline", "middle");

    // Color Scale
    let scaleSvg = d3.select("#scale").append("svg");
    const color = scaleSvg.append('g')
                          .attr('x', 0)
                          .attr('y', 0);

    // create gradient
    const defs = scaleSvg.append("defs"); 
    const linearGradient = defs.append("linearGradient")
                               .attr("id", "color-gradient")
                               .attr("x1", "0%")    //gradient start
                               .attr("y1", "0%")
                               .attr("x2", "100%")  // gradient end
                               .attr("y2", "0%");
    
    linearGradient.append("stop")
                  .attr("offset", "0%")
                  .attr("stop-color", "#d7e6f7");
    
    if (scaleHPI) {
        min = globalIndexMin;
        max = globalIndexMax;
        linearGradient.append("stop")
                  .attr("offset", "100%")
                  .attr("stop-color", "#194475");
    }
    else {
        min = d3.format(".3~s")(globalPriceMin);
        max = d3.format(".3~s")(globalPriceMax);
        linearGradient.append("stop")
                  .attr("offset", "50%")
                  .attr("stop-color", "#194475");
        linearGradient.append("stop")
                  .attr("offset", "100%")
                  .attr("stop-color", "#0c1263");
    }

    color.append('text')
         .attr('x', 0)
         .attr('y', 40)
         .text(min);

    color.append('rect')
         .attr('x', 0)
         .attr('y', 5)
         .attr('width', 250)
         .attr('height', 20)
         .attr('fill',  "url(#color-gradient)");

    color.append('text')
         .attr('x', 220)
         .attr('y', 40)
         .text(max);
}

function generateQuarterlyGraph(){
    // Define svg dimensions
    let HEIGHT = 375;
    let WIDTH = 500;
    let MARGINS = {left: 60, right: 45, top: 75, bottom: 70};
    let selectedYear = d3.min([9, parseInt(d3.select('#year').node().value.substring(2))]);
    let selectedStates = selected.states;
    let filteredSelectedData = [];
    let yAxisValues = [];

    // Select the right svg and remove previous data
    let svg = d3.select("#quarterly-graph");
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
    .attr("x", ((WIDTH - MARGINS.left - MARGINS.right)/2) + 36)
    .attr("y", HEIGHT - 32)
    .text("Quarter");

    let hpiTitleX = ((WIDTH - MARGINS.left - MARGINS.right)/2) - MARGINS.left + 40;
    let priceTitleX = ((WIDTH - MARGINS.left - MARGINS.right)/2)- MARGINS.left;
    svg.append("text")
    .attr("x", scaleHPI ? hpiTitleX : priceTitleX)
    .attr("y", 55)
    .text(scaleHPI ? "Quarterly State HPI in " + years_list[selectedYear] : "Quarterly State Average Price in " + years_list[selectedYear]);

    // Check if nothing is selected
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
                        
    }

    // Declare y axis
    let yScale = d3.scaleLinear().domain([d3.min(yAxisValues), d3.max(yAxisValues)]).range([HEIGHT - (MARGINS.top + MARGINS.bottom), 0]);
    let yAxis = d3.axisLeft().scale(yScale).tickFormat(d3.format(".3~s"));

    // Create the line generator function
    let priceLineGenerator = d3.line()
                       .x(d => xScale(String(d["Quarter"])))
                       .y(d => yScale(d["Average Price"]));
    let indexLineGenerator = d3.line()
                       .x(d => xScale(String(d["Quarter"])))
                       .y(d => yScale(d["SA Index"])); 

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
        .style("stroke", (instances) => colorScale(STATE_NAME_DICT[(instances[0])["State"]]))
        .style("stroke-width", 2)
        .attr("fill", "none")
        .attr("d", (instances) => scaleHPI ? indexLineGenerator(instances) : priceLineGenerator(instances));

    // Create points for the lines
    let points = svg.append("g")
                    .attr("id", "points")
                    .attr("transform", "translate(" + (MARGINS.left) + "," + MARGINS.top + ")");

    // Create text element
    let hoverRect = svg.append("rect").style("fill","white").style("stroke","black").attr("visibility", "hidden");
    let hoverText = svg.append("text")
             .style("fill", "black")
             .style("font-size", "10px")
             .attr("visibility", "hidden");

    filteredSelectedData.forEach(selectedS => {
        points.append("g")
          .selectAll(".point")
          .data(selectedS)
          .enter()
          .append("circle")
          .attr("class", "point")
          .attr("cx", d=> xScale(String(d["Quarter"])))
          .attr("cy", d=> scaleHPI ? yScale(d["SA Index"]) : yScale(d["Average Price"]))
          .attr("r", 3)
          .style("fill", d=> (colorScale(STATE_NAME_DICT[d["State"]])))
          .on("mouseover", function (event, d) {
            let textValue = scaleHPI ? d["SA Index"] : d3.format(".3~s")(d["Average Price"]);
            d3.select(this)
              .transition()
              .duration(75)
              .attr("r", 5);

            let mousePos = d3.pointer(event, svg.node());
            let aboveHalfHeight = mousePos[1] > ((HEIGHT-MARGINS.top-MARGINS.bottom)/2);
            let pastHalfWidth = mousePos[0] > ((HEIGHT-MARGINS.left-MARGINS.right)/2);
            let recWidth = scaleHPI ? 35 : 30;
            let recHeight = scaleHPI ? 12 : 12;
            let moveLeft = scaleHPI ? 26.2 : 27;
            let moveRight = scaleHPI ? 10 : 7;
            
            hoverText.attr("opacity", 0);
            hoverRect.attr("opacity", 0);
            hoverRect.attr("x", pastHalfWidth ? mousePos[0] - moveLeft : mousePos[0] + moveRight)
                     .attr("y", aboveHalfHeight ? mousePos[1] - 20 : mousePos[1] + 10)
                     .attr("width", recWidth)
                     .attr("height", recHeight)
                     .attr("visibility", "visible");
            hoverText.text(textValue)
                     .style("fill", "black")
                     .style("font-size", 12)
                     .attr("x", pastHalfWidth ? mousePos[0] - 25 : mousePos[0] + 10)
                     .attr("y", aboveHalfHeight ? mousePos[1] - 10 : mousePos[1] + 20)
                     .attr("visibility", "visible");
            
            hoverText.transition().duration(200).attr("opacity", 1);
            hoverRect.transition().duration(200).attr("opacity", 1);
          })
          .on("mouseout", function (event, d) {
            d3.select(this)
              .transition()
              .duration(75)
              .attr("r", 3);

            hoverText.transition().duration(200).attr("opacity", 0);
            hoverRect.transition().duration(200).attr("opacity", 0);
          });
    });
    
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
    
    // Create labels group
    let stateLabels = svg.append("g").attr("id", "label-group");
    // Create labels using sorted data
    stateLabels.selectAll("text")
               .data(selectedStates)
               .join("text")
    .attr("x", WIDTH - 30)
    .attr("y", (d,i) => MARGINS.top + (i*15))
    .text(d => d)
    .attr("fill", d => colorScale(d));

}

function generate10YearGraph() {
    // Define svg dimensions
    let HEIGHT = 375;
    let WIDTH = 500;
    let MARGINS = {left: 60, right: 45, top: 75, bottom: 70};
    let yAxisValuesMedian = [];
    let yAxisValuesMean = [];

    // Select the right svg and remove previous data
    let svg = d3.select("#static-graph");
    svg.selectAll("*").remove();

    // Append the x-axis (since it doesn't change)
    let xAxisLabels = ["2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010"]
    let xScale = d3.scalePoint().domain(xAxisLabels).range([0, WIDTH - MARGINS.left - MARGINS.right]);
    let xAxis = d3.axisBottom().scale(xScale);

    svg.append("g")
    .attr("id", "x-axis")
    .attr("transform", "translate(" + MARGINS.left + "," + (HEIGHT - MARGINS.bottom) + ")")
    .call(xAxis);

    svg.append("text")
    .attr("x", ((WIDTH - MARGINS.left - MARGINS.right)/2) + 45)
    .attr("y", HEIGHT - 30)
    .text("Year");

    // Positions for the respective title options
    let medianTitlePos = ((WIDTH - MARGINS.left - MARGINS.right)/2) - MARGINS.left;
    let avgTitlePos = ((WIDTH - MARGINS.left - MARGINS.right)/2)- MARGINS.left;

    // Append the title of the graph
    svg.append("text")
    .attr("x", medianStatic ? medianTitlePos : avgTitlePos)
    .attr("y", 55)
    .text(medianStatic ? "Median US Prices from 2000-2010" : "Average US Prices from 2000-2010");

    // Filter data
    US_DATA.forEach(instance => yAxisValuesMedian.push(instance["Median Price Average"]));
    US_DATA.forEach(instance => yAxisValuesMean.push(instance["Average Price"]));

    // Declare y axis

    let yScaleMean = d3.scaleLinear().domain([d3.min(yAxisValuesMean), d3.max(yAxisValuesMean)]).range([HEIGHT - (MARGINS.top + MARGINS.bottom), 0]);
    let yScaleMedian = d3.scaleLinear().domain([d3.min(yAxisValuesMedian), d3.max(yAxisValuesMedian)]).range([HEIGHT - (MARGINS.top + MARGINS.bottom), 0]);
    let yAxis = d3.axisLeft().scale(yScaleMean).tickFormat(d3.format(".3~s"));

    // Add the y-axis to the svg
    svg.append("g")
        .attr("id", "y-axis")
        .attr("transform", "translate(" + MARGINS.left + "," + MARGINS.top + ")")
        .call(yAxis);
    svg.append("text")
        .attr("x", (0 -(HEIGHT - (MARGINS.top + MARGINS.bottom))/2) - (MARGINS.top + MARGINS.bottom) + 20)
        .attr("y", 15)
        .attr("transform", "rotate(-90)")
        .text("Pricing");

    // Create the line generator function
    let medianLineGenerator = d3.line()
                       .x(d => xScale(String(d["Year"])))
                       .y(d => yScaleMedian(d["Median Price Average"]));
    let avgLineGenerator = d3.line()
                       .x(d => xScale(String(d["Year"])))
                       .y(d => yScaleMean(d["Average Price"])); 

    // Create the map visualization using the path and data
    let line = svg.append("g")
                   .attr("id", "us-line")
                   .attr("transform", "translate(" + (MARGINS.left) + "," + MARGINS.top + ")");

    // Create the line for median
    line.append("path")
        .datum(US_DATA)
        .attr("class", "line")
        .style("stroke", "steelblue")
        .style("stroke-width", 2)
        .attr("fill", "none")
        .attr("d", medianLineGenerator);

    // Create the line for mean    
    line.append("path")
        .datum(US_DATA)
        .attr("class", "line")
        .style("stroke", "#f38000")
        .style("stroke-width", 2)
        .attr("fill", "none")
        .attr("d", avgLineGenerator);

    // Create points for the lines
    let points = svg.append("g")
                    .attr("transform", "translate(" + (MARGINS.left) + "," + MARGINS.top + ")");

    // Create text element
    let hoverRect = svg.append("rect").style("fill","white").style("stroke","black").attr("visibility", "hidden");
    let hoverText = svg.append("text")
                       .style("fill", "black")
                       .style("font-size", "10px")
                       .attr("visibility", "hidden");

    points.selectAll("circle")
          .data(US_DATA)
          .enter()
          .append("circle")
          .attr("cx", d=> xScale(String(d["Year"])))
          .attr("cy", d=> medianStatic ? yScale(d["Median Price Average"]) : yScale(d["Average Price"]))
          .attr("r", 3)
          .style("fill", medianStatic ? "steelblue" : "#f38000")
          .on("mouseover", function (event, d) {
            let textValue = medianStatic ? d3.format(".3~s")(d["Median Price Average"]) : d3.format(".3~s")(d["Average Price"]);
            d3.select(this)
              .transition()
              .duration(75)
              .attr("r", 5);

            let mousePos = d3.pointer(event, svg.node());
            let aboveHalfHeight = mousePos[1] > ((HEIGHT-MARGINS.top-MARGINS.bottom)/2);
            let pastHalfWidth = mousePos[0] > ((HEIGHT-MARGINS.left-MARGINS.right)/2);
          
            hoverText.attr("opacity", 0);
            hoverRect.attr("opacity", 0);
            hoverRect.attr("x", pastHalfWidth ? mousePos[0] - 31 : mousePos[0] + 9)
                     .attr("y", aboveHalfHeight ? mousePos[1] - 24 : mousePos[1] + 12)
                     .attr("width", 27)
                     .attr("height", 14)
                     .attr("visibility", "visible");
            hoverText.text(textValue)
                     .style("fill", "black")
                     .style("font-size", 12)
                     .attr("x", pastHalfWidth ? mousePos[0] - 30 : mousePos[0] + 10)
                     .attr("y", aboveHalfHeight ? mousePos[1] - 13 : mousePos[1] + 23)
                     .attr("visibility", "visible");
          
            hoverText.transition().duration(200).attr("opacity", 1);
            hoverRect.transition().duration(200).attr("opacity", 1);
          })
          .on("mouseout", function (event, d) {
            d3.select(this)
              .transition()
              .duration(75)
              .attr("r", 3);

            hoverText.transition().duration(200).attr("opacity", 0);
            hoverRect.transition().duration(200).attr("opacity", 0);
          });
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
    // Get current year
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
    updateStateColorScale();
    generateQuarterlyGraph();
});