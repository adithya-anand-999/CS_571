import pandas as pd

# Load datasets
avg_price_df = pd.read_csv('./datasets/stateData/estimated_mean_median_house_prices.csv', header = 2)
state_df = pd.read_csv('./datasets/stateData/hpi_states.csv', header = 2)


''' CLEAN STATE DF '''
# Set up columns
state_df.columns = ['State', 'Year', 'Quarter', 'NSA Index', 'SA Index', 'Warning']

# Drop empty rows
cleaned_state_df = state_df.dropna(axis = 0, how = 'all') 

# Limit data to be within range: 2000-2010
cleaned_state_df = cleaned_state_df[cleaned_state_df['Year'].between(2000, 2010)]

# Remove warning column
cleaned_state_df = cleaned_state_df.drop('Warning', axis=1)

# Reset index & make data type into strings and floats
cleaned_state_df = cleaned_state_df.reset_index(drop = True)
#cleaned_state_df['Year'] = cleaned_state_df['Year'].str.strip()
cleaned_state_df['State'] = cleaned_state_df['State'].str.strip()
cleaned_state_df['Quarter'] = cleaned_state_df['Quarter'].astype(int)
cleaned_state_df['Year'] = cleaned_state_df['Year'].astype(int)
cleaned_state_df['NSA Index'] = cleaned_state_df['NSA Index'].astype(float)
cleaned_state_df['SA Index'] = cleaned_state_df['SA Index'].astype(float)

# Declare current df version as the Quarterly HPI Index Set
quarterly_df = cleaned_state_df

# Remove quarters column
cleaned_state_df = cleaned_state_df.drop('Quarter', axis=1)

# Calculate averages & rename columns 
cleaned_state_df = cleaned_state_df.groupby(['State', 'Year']).mean()
cleaned_state_df = cleaned_state_df.reset_index()
cleaned_state_df = cleaned_state_df.rename(columns = {'NSA Index':'NSA Index Average', 'SA Index':'SA Index Average'})

''' CLEAN AVG PRICE DF'''
# Set up columns
cleaned_price_df = avg_price_df
cleaned_price_df.columns = cleaned_price_df.iloc[0]
cleaned_price_df = cleaned_price_df.drop([0])

# Drop empty rows
cleaned_price_df = cleaned_price_df.dropna(axis = 0, how = 'all')

# Get the average 
print(cleaned_price_df.info())

# Make quarterly data branch
quarterly_price_df = cleaned_price_df.copy()
quarterly_price_df['Year'] = quarterly_price_df['Year-Quarter'].str.slice(0, 4).astype(int)
quarterly_price_df['Quarter'] = quarterly_price_df['Year-Quarter'].str.slice(5).astype(int)
quarterly_price_df = quarterly_price_df.drop('Year-Quarter', axis=1)
quarterly_price_df = quarterly_price_df.drop('Median Price', axis=1)
quarterly_price_df['Average Price'] = quarterly_price_df['Average Price'].replace({'\$': '', ',': '', ' ':''}, regex=True)
quarterly_price_df['Average Price'] = quarterly_price_df['Average Price'].astype(float)
print(quarterly_price_df)

# Take out quarter numbers
cleaned_price_df['Year-Quarter'] = cleaned_price_df['Year-Quarter'].apply(lambda x: x[0:4])
print(cleaned_price_df)

# Make data type into strings and floats
cleaned_price_df['Year-Quarter'] = cleaned_price_df['Year-Quarter'].astype(int)
cleaned_price_df['State'] = cleaned_price_df['State'].str.strip()
cleaned_price_df['Average Price'] = cleaned_price_df['Average Price'].replace({'\$': '', ',': '', ' ':''}, regex=True)
cleaned_price_df['Average Price'] = cleaned_price_df['Average Price'].astype(float)
cleaned_price_df['Median Price'] = cleaned_price_df['Median Price'].replace({'\$': '', ',': '', ' ':''}, regex=True)
cleaned_price_df['Median Price'] = cleaned_price_df['Median Price'].astype(float)

# Calculate averages  
cleaned_price_df = cleaned_price_df.groupby(['State', 'Year-Quarter']).mean()
cleaned_price_df = cleaned_price_df.reset_index()
cleaned_price_df = cleaned_price_df.rename(columns = {'Year-Quarter':'Year', 'Median Price':'Median Price Average'})


''' GROUP THE DATAFRAMES '''
grouped_df = pd.merge(cleaned_state_df, cleaned_price_df, on = ['State', 'Year'], how = 'outer')
grouped_df = grouped_df[grouped_df['State']!='US'] # removed rows with US for coloring purposes
final_quarterly_df = pd.merge(quarterly_df, quarterly_price_df, on=['State', 'Year', 'Quarter'], how = 'outer')
final_quarterly_df = final_quarterly_df[final_quarterly_df['State']!='US'] # removed rows with US for coloring purposes
print(grouped_df)


''' EXPORT AS JSON '''
grouped_df.to_json('./datasets/jsonFiles/annualStateData.json', orient='records', lines=False)
#quarterly_df.to_json('./datasets/jsonFiles/quarterlyStateData.json', orient='records', lines=False)
final_quarterly_df.to_json('./datasets/jsonFiles/quarterlyStateData.json', orient='records', lines=False)