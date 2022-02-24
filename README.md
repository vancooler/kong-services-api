
## Description

The application is built based on Nest framework TypeScript starter repository template for assignment described in [this page](https://docs.google.com/document/d/1wnZu4hu9RsH7COFtpa8af3pQy0NtOGhR54ajZxs61ZE/edit#heading=h.9zyuxgmou4f5).

A demo vedio can be found as `demo.mp4` in this repo.

## Installation

```bash
$ npm install
```

## Running the app

###Setup

#### Environment variables
Need to provide database secret and JWT secret in .env file, something like this:

```
DB_NAME = database_name
DB_PORT = 5432
DB_HOST = localhost
DB_USERNAME = username
DB_PASSWORD = password
DB_SYNC = true
DB_LOG = true
JWT_SECRET = secret_key
```

#### Data seeding

To run the application locally with some data, chose to seed with some sql statements as the easiest way when there is no APIs for creating resources.

Create a testing account 

```sql
INSERT INTO accounts (name) VALUES ('my org');
```

Create a testing user

**NOTE:** Just for convenience of demo, there is a block of code in login logic to output encrypted password for seeding user data. 

```sql
INSERT INTO users (name, email, password, accountId) VALUES ('aaa', 'aa@aa.com', 'ENCRYPTED_SALT_PASSWORD_FROM_CODE_OUTPUT', 'ACCOUNT_ID_FROM_INSERTED_ACCOUNT');
```

Create some services

```sql
INSERT INTO services (name, description, account_id) VALUES ('service name', 'this is a description for service', 'ACCOUNT_ID_FROM_INSERTED_ACCOUNT');
```

Create some versions

```sql
INSERT INTO versions (name, description, service_id) VALUES ('version name', 'this is a description for version', 'SERVICE_ID_FROM_INSERTED_SERVICE');
```


### Running

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Test

Since it is a time limited project, chose to only implement e2e tests which in my opinion provides highest ROI in testing pyramid when there are 0 tests.

```bash
# run e2e tests
$ npm run test:e2e
```

## Assumptions and Considerations
With the story grooming session and some afterwards thoughts, I had these assumptions and design in mind:

1. There are 4 resources involved: Account, User, Service, and Version. Service and Version are the main features while Account and User are mainly for authentication and authorization context.

2. Each user belongs to exactly one account and can only access to resources like services/versions under that account.

3. Each Account may have up to 10,000 services. And each service can have up to 100 versions.

4. Name of service or version can have no more than 1000 characters, while description can have 10,000 characters as maximum.

5. Services list API should support a simple case-insensitive search functionality to match exact substring on name or description of a service.

6. Services list API should order by updated timestamp in descending order.

7. Pagination should be supported with default page size as 12. Offset pagination should be good enough as each account only has up to 10,000 services.

8. Services list API should also response versions information including total number of versions and top 10 most recent updated versions. 


## Trade-offs Discussion

1. Given the limited time to achieve the majority of the functionality, I focused on get services listing and get single service APIs with proper JWT authentication. No more time for resources writing part. Also authentication part only focused on getting JWT token and authentication with JWT part, related features like user registration, JWT token refresh can be considered as existing components or furture improvement.

2. Only implement e2e tests which in my opinion provides highest ROI in testing pyramid when there are no tests at all. Unit tests should also be added if I have more time.

3. As it is a demo project, I commited code directly to master branch, will definitely not do that for real product repo. For similar reason, many other production required components are not taken into consideration here like CI/CD, cloud infrustrature, load balancing, observability(logging, metrics, alerts), etc.

4. Naming of `Service` resource. I feel it would increase communication cost in the long run as `Service` the word itself can be used for many things. As I don't more context around it, still choose to use it in code. In a real working environment, I would try to find a better term of it if possible.

5. TypeOrm is new tool for me. It is covenient for some features. However, there are some features not supported. I put lots of time researching how to create GIN index on name/description columns for better performance on searching, but looks like TypeOrm doesn't support it. I think the only way is to add a sql migration to add the proper index, I will consider it as a future improvement point for sure.

6. During story grooming, we discussed about data size estimation on services and versions(10k services per account and 100 versions per service), but didn't talk how many accounts will there be in the whole system. Current single table in single db structure should be good at small scale like thousands of accounts. When the product gets popular and there are millions of accounts, DB could be a bottleneck and we need to consider db sharding by accounts groups.


Any discuss or comments are welcome and appreciated. :)  
