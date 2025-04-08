import pandas as pd

# read in csv metro data file
metro_data = pd.read_csv('./datasets/metroData/metro_quarter_hpi.csv', header=2)

# setup new column names
metro_data.columns = ['CBSA index', 'metro_name', 'year', 'quarter', 'HPI_NSA', 'HPI_SA']

# drop any rows with null/None values, and grab data between [2000,2010]
clean_metro_data = metro_data.dropna(axis=0, how='any')
clean_metro_data = clean_metro_data[clean_metro_data['year'].between(2000,2010)]
clean_metro_data = clean_metro_data.reset_index(drop=True) # after dropping rows you need to reset indices  

# correct types for columns 
clean_metro_data['quarter'] = clean_metro_data['quarter'].astype(int)
clean_metro_data['HPI_NSA'] = clean_metro_data['HPI_NSA'].astype(float)
clean_metro_data['HPI_SA'] = clean_metro_data['HPI_SA'].astype(float)

quarter_metro_data = clean_metro_data

# we are grouping the data based on quarters of a year, as such we need to group our data on the year and drop the 
# quarter column
clean_metro_data = clean_metro_data.drop('quarter', axis=1)
clean_metro_data = clean_metro_data.groupby(['metro_name', 'year']).mean()
clean_metro_data = clean_metro_data.reset_index()

# print(clean_metro_data)

# export the data as json to the jsonFiles folder
clean_metro_data.to_json('./datasets/jsonFiles/metro_data.json', orient='records', lines=False)
