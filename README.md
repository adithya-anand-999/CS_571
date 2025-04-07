# Housing Prices in Major US Cities between 2000Q1-2010Q2

## Authors
Adithya Anand, Blair Huang, Isabella Marino

## Background and Motivation
As graduation nears, housing and its associated costs become more and more relevant to us. How much should a house normally cost in an area? Am I getting a good deal or could I do better? Should I rent or buy? Will I be able to sustain living in this particular neighborhood long term? These questions, coupled with extensive yet confusing datasets available to the public, motivated us to focus on trends in housing prices across major cities in the United States. We hope to find and help visualize general housing trends in the past few decades.

Our data is sourced from the Federal Housing Financial Agency (FHFA). They introduce themselves as: 

> “an independent agency established by the Housing and Economic Recovery Act of 2008 (HERA) and is responsible for the effective supervision, regulation, and housing mission oversight of the Federal National Mortgage Association (Fannie Mae), the Federal Home Loan Mortgage Corporation (Freddie Mac), and the Federal Home Loan Bank System…The Agency's mission is to ensure that Fannie Mae and Freddie Mac (the Enterprises) and the FHLBanks (together, "the regulated entities") fulfill their mission by operating in a safe and sound manner to serve as a reliable source of liquidity and funding for housing finance and community investment. Since 2008, FHFA has also served as conservator of Fannie Mae and Freddie Mac.”

We will be using their House Price Index Datasets as the backbone of our visualization. The House Price Index (HPI) can be seen as an economic indicator of our current economy. HPI “[measures] changes in single-family home values based on data that extend back to the mid-1970s from all 50 states and over 400 American cities.” It is “a weighted, repeat-sales index, meaning that it measures average price changes in repeat sales or refinancings on the same properties.” This information is obtained by the FHFA through “reviewing repeat mortgage transactions on single-family properties whose mortgages have been purchased or securitized by Fannie Mae or Freddie Mac since January 1975.” HPI provides a good estimate on mortgage defaults and general housing affordability.

## Project Objectives
With this project we hope to learn more about housing costs and trends. Especially as such information is becoming more relevant with graduation approaching. Understanding the housing market and what it means can be overwhelming. We understand that we currently are not the most knowledgeable on the topic, however we realize how important it is to be aware. For example, housing trends may help pinpoint cities to avoid due to rapidly increasing rent prices. Alternatively, such trends might also help someone find a place that best fits their needs. As we continue our research and develop our visualization we want to become more knowledgeable so that we can make these informed decisions about our futures. 

The benefits of doing this are plentiful. More than just educating ourselves, we want our visualization to make the topic more approachable for the general public. Afterall, visualizations are meant to communicate ideas and make information accessible. There are likely a lot of people out there wondering what is their best next step. Having access to a visualization about housing prices and trends will allow those people to more effectively decide such. In order to help them, we will construct our interactive visualization with this aim in mind. Our main objective is to make the visualization easy to understand while ensuring the most important information is being showcased properly. 

## Data
Our data is sourced from the Federal Housing Financial Agency (FHFA). FHFA “incorporates tens of millions of home sales [from Fannie Mae and Freddie Mac] and offers insights about house price fluctuation at the national, census division, state, metro area, county, ZIP code, and census tract levels.” We will only be focusing on a subset of the available dataset, specifically on Quarterly Average and Median Prices for States and U.S.: 2000Q1-2010Q2, Counties (Developmental Index; Not Seasonally Adjusted), and CBSAs (Developmental Index; Not Seasonally Adjusted). The first includes average and median prices by state, the second by Counties, and the third by metropolitan/micropolitan areas. We will mainly be extracting information of major cities from these three datasets. 

## Data Processing
The place we are sourcing our data from has a large number of datasets to work with that are extensive and well documented. Individually, most of the sets are ready-to-go, however, most of the sets don’t cover all of the information we want to look at as they each have a specific purpose. While some focus on the US as a whole, others look at specific cities, states, or areas. For our visualization, we want to display a wide variety of data and therefore we might need to combine the information from a few of the available datasets. By doing this we will be able to derive a large quantity of information across multiple years. It is important to note that some of the datasets are seasonally adjusted while others are not. For the sake of consistency our combined set will only use datasets of the same type.

After combining these sets we will likely need to limit the data we use to only reflect our chosen time frame. Doing so will filter out information that isn’t necessarily relevant since our focus is on HPI information and trends from recent years. Additionally, we will need to make sure the data is complete. While most sets are ready-to-go as previously mentioned, there are a few that have gaps within their data. These gaps will need to be filtered out and handled accordingly. In order to do this we will need to clean up the combined set by removing any pieces that have incomplete or missing information. Our team believes using the pandas library will be the best approach to process our data to complete the above. 

