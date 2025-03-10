# transaction-decorator
simple node js API to sort and decorate transaction information

## How to Run
    - Install dependences `npm install`
    - Build `npm run build`
    - Start `npm start`

    You should be able to go to [localhost:3000](http://localhost:3000/docs) where you'll be able to see and use the API Reference (SwaggerUI) to query the endpoints.
    The Customer Ids are (1 - 9), so you can just use those.

    The app uses ESM and Modules so I'm using Node v22.10. This version or higher should work fine.
    If you run into issue please verify your node version. If you use `nvm` running `nvm use` should work
    as there's an `.nvmrc` file in the repo.

## How to Run Tests
    - Install dependencies `npm install`
    - Run Tests `npm test`


## How stuff works
On start up, the Transactions List Plugin will fetch the transactions from the external API. It will fall
back to using the local copy of the data if this query fails.

Once the data is fetched, the Customer Service
plugin will build the Transactions and Relationships graph. After this is done the endpoints can be called
to fetch the data. 

Transactions and Relationships are stored in maps for fast O(1) access. The cost of building the maps is paid
upfront when the application starts and subseqent lookups are speedy.

