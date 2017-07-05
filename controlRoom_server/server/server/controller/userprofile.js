// Http method: GET
// URI        : /userprofiles/?username=:USER_NAME
// Read the profile of user given in :USER_NAME
module.exports = function (app, SQL) {

var module = {};
// Http Method: GET
// URI        : /user_profiles
// Read all the user profiles
module.get = function (req,res) {
        app.get('/api/user_profiles/', function (req, res) {
        "use strict";

        console.log("Param:" + req.query);
        SQL.executeLibQuery("'ADM0000001'","{(:USER_NAME:,req.query.USER_NAME)}", //{USER_NAME: req.query.USER_NAME}, 
                            req.header('USER'), req, res);
                            //JSON.stringify(req.header('USER')), req, res);
        // Check if the query is for a user or all users (filtered or not)
        /*if (req.originalUrl.includes("?")) {
            SQL.execute("SELECT * FROM USER_PROFILES WHERE USER_NAME = :USER_NAME", 
                           {USER_NAME: req.query.USER_NAME}, req.header('USER'), req, res);
            }
        else {
            SQL.execute("SELECT * FROM USER_PROFILES ", 
                           {}, req.header('USER'), 
                           req, res);
            }*/
        });

    };

// Http method: POST
// URI        : /user_profiles
// Creates a new user profile
module.post = function (req,res) {
        app.post('/user_profiles/', function (req, res) {
            "use strict";
        SQL.execute("INSERT INTO user_profiles VALUES (" +
                      ":USER_NAME, :DISPLAY_NAME, " + 
                      ":DESCRIPTION, :GENDER," +
                      ":AGE, :COUNTRY, :THEME) ", 
                      {USER_NAME: req.body.USER_NAME,
                       DISPLAY_NAME:  req.body.DISPLAY_NAME,
                       DESCRIPTION:  req.body.DESCRIPTION,
                       GENDER:  req.body.GENDER,
                       AGE:  req.body.AGE,
                       COUNTRY:  req.body.COUNTRY,
                       THEME:  req.body.THEME}, 
                       req.header('USER'),
                       req, res);
             });
    };

// Http method: Delete
// URI        : /user_profiles
// Delete an existing profile
module.delete = function (req,res) {
        app.delete('/user_profiles/', function (req, res) {
            "use strict";
        SQL.execute("DELETE FROM USER_PROFILES WHERE USER_NAME = :USER_NAME", 
                      {USER_NAME: req.query.USER_NAME}, 
                       req.header('USER'),
                       req, res);
        });
    };

// Http method: PUT
// URI        : /user_profiles/?username=:USER_NAME
// Update the profile of user given in :USER_NAME
module.put = function (req,res) {
        app.put('/user_profiles/:USER_NAME', function (req, res) {
        "use strict";
        var statement = "";
        var bindValues = {};

        if (req.body.DISPLAY_NAME) {
            statement += "DISPLAY_NAME = :DISPLAY_NAME";
            bindValues.DISPLAY_NAME = req.body.DISPLAY_NAME;
        }
        if (req.body.DESCRIPTION) {
            if (statement) statement = statement + ", ";
            statement += "DESCRIPTION = :DESCRIPTION";
            bindValues.DESCRIPTION = req.body.DESCRIPTION;
        }
        if (req.body.GENDER) {
            if (statement) statement = statement + ", ";
            statement += "GENDER = :GENDER";
            bindValues.GENDER = req.body.GENDER;
        }
        if (req.body.AGE) {
            if (statement) statement = statement + ", ";
            statement += "AGE = :AGE";
            bindValues.AGE = req.body.AGE;
        }
        if (req.body.COUNTRY) {
            if (statement) statement = statement + ", ";
            statement += "COUNTRY = :COUNTRY";
            bindValues.COUNTRY = req.body.COUNTRY;
        }
        if (req.body.THEME) {
            if (statement) statement = statement + ", ";
            statement += "THEME = :THEME";
            bindValues.THEME = req.body.THEME;
        }

        statement += " WHERE USER_NAME = :USER_NAME";
        bindValues.USER_NAME = req.params.USER_NAME;
        statement = "UPDATE USER_PROFILES SET " + statement;

        SQL.execute(statement, bindValues, req.header('USER'), req, res);
                    
        });
    }

    return module;
};