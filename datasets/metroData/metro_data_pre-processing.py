import pandas as pd
from geopy.geocoders import Nominatim
from datetime import datetime
import googlemaps
import time

API_KEY = "#################"

# read in csv metro data file
metro_data = pd.read_csv('./datasets/metroData/metro_quarter_hpi.csv', header=2)

# setup new column names
metro_data.columns = ['CBSA index', 'Metro_name', 'Year', 'Quarter', 'HPI_NSA', 'HPI_SA']

# drop any rows with null/None values, and grab data between [2000,2010]
clean_metro_data = metro_data.dropna(axis=0, how='any')
clean_metro_data = clean_metro_data[clean_metro_data['Year'].between(2000,2010)]
clean_metro_data = clean_metro_data.reset_index(drop=True) # after dropping rows you need to reset indices  

# converts states into a list, also if state is DC collapses all states to simply be DC
def extract_states(state_str):
    states = state_str.split(" ")[0].split('-')
    if 'DC' in states:
        return ['DC']
    return states

def get_lat_long_google(row, api_key):
    city,state = str(row.Metro_name.split('-')[0]), row.State[0]
    gmaps = googlemaps.Client(key=api_key)
    geocode_result = gmaps.geocode(f"{city}, {state}")
    if geocode_result:
        location = geocode_result[0]['geometry']['location']
        return (round(location['lat'],4), round(location['lng'],4))
    return (None)


def coordinates_from_dictionary(metro_name): return unique_metro_cords[metro_name]


# split metro_name col into the metro and state.
split_names = clean_metro_data['Metro_name'].str.split(', ')
new_metro_data, new_state_data = split_names.str[0], split_names.str[1].apply(extract_states)
clean_metro_data['Metro_name'] = new_metro_data
clean_metro_data['State'] = new_state_data

start = datetime.now()
print(start)
unique_metros_rows = clean_metro_data.drop_duplicates(subset='Metro_name')
unique_metro_cords = {row.Metro_name : get_lat_long_google(row,API_KEY) for _,row in unique_metros_rows.iterrows()}
mid = datetime.now()
print('Elapsed 1 ', mid-start)
clean_metro_data['Cords'] = clean_metro_data['Metro_name'].apply(coordinates_from_dictionary)
print('Elapsed 2 ', datetime.now()-mid)

# duplicate rows for each state a metro appearers in
clean_metro_data = clean_metro_data.explode('State')

# Move 'state' just before 'metro_name'
cols = clean_metro_data.columns.tolist()
cols.insert(cols.index('Metro_name'), cols.pop(cols.index('State')))
clean_metro_data = clean_metro_data[cols]

# correct types for columns 
clean_metro_data['Quarter'] = clean_metro_data['Quarter'].astype(int)
clean_metro_data['HPI_NSA'] = clean_metro_data['HPI_NSA'].astype(float)
clean_metro_data['HPI_SA'] = clean_metro_data['HPI_SA'].astype(float)


# store the quarter data before we merge on quarters.
quarter_metro_data = clean_metro_data

# we are grouping the data based on quarters of a year, as such we need to group our data on the year and drop the 
# quarter column
clean_metro_data = clean_metro_data.drop('Quarter', axis=1)
# numeric_cols = clean_metro_data.select_dtypes(include='number' or 'float').columns
clean_metro_data = clean_metro_data.groupby(['State', 'Metro_name', 'Year', 'Cords']).mean().reset_index()
# clean_metro_data = clean_metro_data.reset_index() # above code basically deletes rows, as such need to reset index. 
# Keep drop as default value False as this keeps the cols metro_name and year. 

print(clean_metro_data)

# export the data as json to the jsonFiles folder
clean_metro_data.to_json('./datasets/jsonFiles/metro_data.json', orient='records', lines=False)
