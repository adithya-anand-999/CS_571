# Housing Prices in Major US Cities between 2000Q1-2010Q2

## Authors
Adithya Anand, Blair Huang, Isabella Marino

## Process Book 
https://docs.google.com/document/d/14G_KiDar4GGV3Y_F_achrRgLeVwDGobJ57sT6AxJOWk/edit?usp=sharing

## Instructions on how to start and find our code
To start our code you navigate to the top directory of our GitHub repo to find the website.html file. Then you start website.html using live server. From here you can view the output of all the code we have worked on.  

All our code to clean the datasets are found across 2 python files. These are found in files ./datasets/metroData/metro_data_pre_processing.py and ./datasets/stateData/stateDataPreProcessing.py

## Background and Motivation
We were initially motivated to do this project because of the mercurial nature of the housing market, especially as recent politics unfold. At the same time, the datasets we are working with – HPI indices and average housing prices – provided by the federal government implied a well-rounded and reliable source of data.
Our data is sourced from the Federal Housing Financial Agency (FHFA). They introduce themselves as: 

> “an independent agency established by the Housing and Economic Recovery Act of 2008 (HERA) and is responsible for the effective supervision, regulation, and housing mission oversight of the Federal National Mortgage Association (Fannie Mae), the Federal Home Loan Mortgage Corporation (Freddie Mac), and the Federal Home Loan Bank System…The Agency's mission is to ensure that Fannie Mae and Freddie Mac (the Enterprises) and the FHLBanks (together, "the regulated entities") fulfill their mission by operating in a safe and sound manner to serve as a reliable source of liquidity and funding for housing finance and community investment. Since 2008, FHFA has also served as conservator of Fannie Mae and Freddie Mac.”

Unlike our initial proposal, we have decided to focus on three particular datasets, and due to one of them restricted to between the years 2000 to 2010,  we also inevitably put a constraint on the window in history in which we will be examining the housing prices. Acknowledging that HPI indices may bear less weight to a general audience when it comes to understanding fluctuating housing prices, we will be using the datasets: estimated mean and medium housing from 2000Q1–2010Q2. However, we are also interested in the HPI indices (for other audiences who may be interested as well), as such, we will also examine two HPI indices between the years 2000 – 2010. One of them includes the HPI index of all states and the other will focus on the HPI index of all metropolitan areas, acknowledging that many might be more interested in metropolis data as that’s where many in the country congregate.

The House Price Index (HPI) can be seen as an economic indicator of our current economy. HPI “[measures] changes in single-family home values based on data that extend back to the mid-1970s from all 50 states and over 400 American cities.” It is “a weighted, repeat-sales index, meaning that it measures average price changes in repeat sales or refinancings on the same properties.” This information is obtained by the FHFA through “reviewing repeat mortgage transactions on single-family properties whose mortgages have been purchased or securitized by Fannie Mae or Freddie Mac since January 1975.” HPI provides a good estimate on mortgage defaults and general housing affordability.

## Project Objectives
With this project we hope to learn more about housing costs and trends. Especially as such information is becoming more relevant with graduation approaching. Understanding the housing market and what it means can be overwhelming. We understand that we currently are not the most knowledgeable on the topic, however we realize how important it is to be aware. For example, housing trends may help pinpoint cities to avoid due to rapidly increasing rent prices. Alternatively, such trends might also help someone find a place that best fits their needs. As we continue our research and develop our visualization we want to become more knowledgeable so that we can make these informed decisions about our futures. 

The question we plan to answer is how the 2008 financial crisis affected the US housing market. For this we look into all states and major metropolitan areas across the county. We limit our scope to span 2000-2010 so we get a complete picture of the housing market leading up to the financial crisis and what occurred after. With this data we hope to better educate the viewer on how 2008 really impacted housing prices. 

## Data
Our data is sourced from the Federal Housing Financial Agency (FHFA). FHFA “incorporates tens of millions of home sales [from Fannie Mae and Freddie Mac] and offers insights about house price fluctuation at the national, census division, state, metro area, county, ZIP code, and census tract levels.” We will only be focusing on a subset of the available dataset, specifically on Quarterly Average and Median Prices for States and U.S.: 2000Q1-2010Q2, Counties (Developmental Index; Not Seasonally Adjusted), and CBSAs (Developmental Index; Not Seasonally Adjusted). The first includes average and median prices by state, the second by Counties, and the third by metropolitan/micropolitan areas. We will mainly be extracting information of major cities from these three datasets. 

## Data Processing
The place we are sourcing our data from has a large number of datasets to work with that are extensive and well documented. Individually, most of the sets are ready-to-go, however, most of the sets don’t cover all of the information we want to look at as they each have a specific purpose. While some focus on the US as a whole, others look at specific cities, states, or areas. For our visualization, we want to display a wide variety of data and therefore we might need to combine the information from a few of the available datasets. By doing this we will be able to derive a large quantity of information across multiple years. It is important to note that some of the datasets are seasonally adjusted while others are not. For the sake of consistency our combined set will only use datasets of the same type.

After combining these sets we will likely need to limit the data we use to only reflect our chosen time frame. Doing so will filter out information that isn’t necessarily relevant since our focus is on HPI information and trends from recent years. Additionally, we will need to make sure the data is complete. While most sets are ready-to-go as previously mentioned, there are a few that have gaps within their data. These gaps will need to be filtered out and handled accordingly. In order to do this we will need to clean up the combined set by removing any pieces that have incomplete or missing information. Our team believes using the pandas library will be the best approach to process our data to complete the above. 

