import pandas as pd

# Load dataset
df = pd.read_csv('./datasets/estimated_mean_median_house_prices.csv', header = 2)

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
