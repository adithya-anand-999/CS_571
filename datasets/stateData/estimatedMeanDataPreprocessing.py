import pandas as pd

# Load dataset
df = pd.read_csv('./datasets/estimated_mean_median_house_prices.csv', header = 2)
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
cleaned_state_df['Quarter'] = cleaned_state_df['Quarter'].astype(float)
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

# Set up columns
dfCleaned = df
dfCleaned.columns = dfCleaned.iloc[0]
dfCleaned = dfCleaned.drop([0])

# Drop empty rows
dfCleaned = dfCleaned.dropna(axis = 0, how = 'all')

# Get the average 
print(dfCleaned.info())

# Take out quarter numbers
dfCleaned['Year-Quarter'] = dfCleaned['Year-Quarter'].apply(lambda x: x[0:4])
print(dfCleaned)

# Make data type into strings and floats
dfCleaned['Year-Quarter'] = dfCleaned['Year-Quarter'].str.strip()
dfCleaned['State'] = dfCleaned['State'].str.strip()
dfCleaned['Average Price'] = dfCleaned['Average Price'].replace({'\$': '', ',': '', ' ':''}, regex=True)
dfCleaned['Average Price'] = dfCleaned['Average Price'].astype(float)
dfCleaned['Median Price'] = dfCleaned['Median Price'].replace({'\$': '', ',': '', ' ':''}, regex=True)
dfCleaned['Median Price'] = dfCleaned['Median Price'].astype(float)

# Calculate averages  
groupedDf = dfCleaned.groupby(['State', 'Year-Quarter']).mean()
groupedDf = groupedDf.reset_index()
groupedDf = groupedDf.rename(columns = {'Year-Quarter':'Year', 'Median Price':'Median Price Average'})

# Export cleaned data
groupedDf.to_json('cleanedMeanMedianPriceData.json', orient='records', lines=True)
