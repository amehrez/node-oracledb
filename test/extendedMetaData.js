/* Copyright (c) 2016, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * The node-oracledb test suite uses 'mocha', 'should' and 'async'.
 * See LICENSE.md for relevant licenses.
 *
 * NAME
 *   17. extendedMetaData.js
 *
 * DESCRIPTION
 *   Testing extended metadata feature.
 *
 * NUMBERING RULE
 *   Test numbers follow this numbering rule:
 *     1  - 20  are reserved for basic functional tests
 *     21 - 50  are reserved for data type supporting tests
 *     51 onwards are for other tests
 *
 *****************************************************************************/
'use strict';

var oracledb = require('oracledb');
var should   = require('should');
var async    = require('async');
var dbConfig = require('./dbconfig.js');

describe('17. extendedMetaData.js', function() {

  var connection = null;
  before(function(done) {

    async.series([
      function(cb) {
        oracledb.getConnection(dbConfig, function(err, conn) {
          should.not.exist(err);
          connection = conn;
          cb();
        });
      },
      function(cb) {
        var proc = "BEGIN \n" +
                   "    DECLARE \n" +
                   "        e_table_missing EXCEPTION; \n" +
                   "        PRAGMA EXCEPTION_INIT(e_table_missing, -00942); \n" +
                   "    BEGIN \n" +
                   "        EXECUTE IMMEDIATE('DROP TABLE nodb_md'); \n" +
                   "    EXCEPTION \n" +
                   "        WHEN e_table_missing \n" +
                   "        THEN NULL; \n" +
                   "    END; \n" +
                   "    EXECUTE IMMEDIATE (' \n" +
                   "        CREATE TABLE nodb_md ( \n" +
                   "            num    NUMBER, \n" +
                   "            vch    VARCHAR2(1000), \n" +
                   "            dt     DATE \n" +
                   "        ) \n" +
                   "    '); \n" +
                   "END; ";

        connection.execute(
          proc,
          function(err) {
            should.not.exist(err);
            cb();
          }
        );
      },
      function(cb) {
        var date = new Date(2016, 7, 1);
        connection.execute(
          "INSERT INTO nodb_md VALUES (:n, :c, :d)",
          {
            n: { val: 23, type: oracledb.NUMBER },
            c: "Human Resources",
            d: { val: date, type: oracledb.DATE }
          },
          function(err) {
            should.not.exist(err);
            cb();
          }
        );
      }
    ], done);
  }); // before

  after(function(done) {

    async.series([
      function(cb) {
        connection.execute(
          "DROP TABLE nodb_md",
          function(err) {
            should.not.exist(err);
            cb();
          }
        );
      },
      function(cb) {
        connection.release(function(err) {
          should.not.exist(err);
          cb();
        });
      }
    ], done);
  }); // after

  describe('17.1 extendedMetaData as an execute() option', function() {

    it("17.1.1 default value is 'false' when not setting", function(done) {

      connection.execute(
        "SELECT * FROM nodb_md",
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual([ { name: 'NUM' }, { name: 'VCH' }, { name: 'DT' } ]);
          done();
        }
      );
    }); // 17.1.1

    it("17.1.2 sets to be 'false' explicitly", function(done) {

      connection.execute(
        "SELECT * FROM nodb_md",
        [],
        { extendedMetaData: false },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual([ { name: 'NUM' }, { name: 'VCH' }, { name: 'DT' } ]);
          done();
        }
      );
    });

    it("17.1.3 sets to be 'true' to enable extended metadata display", function(done) {

      connection.execute(
        "SELECT dt FROM nodb_md",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual( [ { name: 'DT', fetchType: 2003, dbType: 12, nullable: true } ] );
          done();
        }
      );
    });

    it("17.1.4 works as 'false' when setting to 0", function(done) {

      connection.execute(
        "SELECT * FROM nodb_md",
        [],
        { extendedMetaData: 0 },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual([ { name: 'NUM' }, { name: 'VCH' }, { name: 'DT' } ]);
          done();
        }
      );
    });

    it("17.1.5 works as 'false' when setting to 'null'", function(done) {

      connection.execute(
        "SELECT * FROM nodb_md",
        [],
        { extendedMetaData: null },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual([ { name: 'NUM' }, { name: 'VCH' }, { name: 'DT' } ]);
          done();
        }
      );
    });

    it("17.1.6 works as 'false' when setting to 'undefined'", function(done) {

      connection.execute(
        "SELECT * FROM nodb_md",
        [],
        { extendedMetaData: undefined },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual([ { name: 'NUM' }, { name: 'VCH' }, { name: 'DT' } ]);
          done();
        }
      );
    });

    it("17.1.7 works as 'false' when setting to 'NaN'", function(done) {

      connection.execute(
        "SELECT * FROM nodb_md",
        [],
        { extendedMetaData: NaN },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual([ { name: 'NUM' }, { name: 'VCH' }, { name: 'DT' } ]);
          done();
        }
      );
    });

    it("17.1.8 works as 'true' when setting to a positive number", function(done) {

      connection.execute(
        "SELECT dt FROM nodb_md",
        [],
        { extendedMetaData: 9 },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual( [ { name: 'DT', fetchType: 2003, dbType: 12, nullable: true } ] );
          done();
        }
      );
    });

    it("17.1.9 works as 'true' when setting to a negative number", function(done) {

      connection.execute(
        "SELECT dt FROM nodb_md",
        [],
        { extendedMetaData: -55 },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual( [ { name: 'DT', fetchType: 2003, dbType: 12, nullable: true } ] );
          done();
        }
      );
    });

    it("17.1.10 works as 'true' when setting to a string", function(done) {

      connection.execute(
        "SELECT dt FROM nodb_md",
        [],
        { extendedMetaData: 'foobar' },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual( [ { name: 'DT', fetchType: 2003, dbType: 12, nullable: true } ] );
          done();
        }
      );
    });

    it("17.1.11 the option is case-sensitive", function(done) {

      connection.execute(
        "SELECT dt FROM nodb_md",
        [],
        { extendedMetadata: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual( [ { name: 'DT' } ] );
          done();
        }
      );
    });

    it("17.1.12 only works with SELECT query", function(done) {

      var cdate = new Date(2016, 6, 1);
      connection.execute(
        "INSERT INTO nodb_md VALUES (99, 'FACILITY', :d)",
        [ cdate ],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          should.not.exist(result.metaData);
          done();
        }
      );
    });

  }); // 17.1

  describe('17.2 global option - oracledb.extendedMetaData', function() {

    var verify = function(setValue, expect, done) {

      var defaultValue = oracledb.extendedMetaData;
      async.series([
        function change(callback) {
          oracledb.extendedMetaData = setValue;
          callback();
        },
        function test(callback) {
          if (!expect) {
            (oracledb.extendedMetaData).should.be.false();
            verifyFalse(callback);
          }
          else {
            (oracledb.extendedMetaData).should.be.true();
            verifyTrue(callback);
          } // else
        },
        function restore(callback) {
          oracledb.extendedMetaData = false;
          (oracledb.extendedMetaData).should.be.equal(defaultValue);
          callback();
        }
      ], done);
    }; // verify()

    var verifyFalse = function(cb) {
      connection.execute(
        "SELECT * FROM nodb_md",
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual([
            { name: 'NUM' }, { name: 'VCH' }, { name: 'DT' }
          ]);
          cb();
        }
      );
    };

    var verifyTrue = function(cb) {
      connection.execute(
        "SELECT * FROM nodb_md",
        function(err, result) {
          should.not.exist(err);
          (result.metaData[0]).should.deepEqual(
            { name: 'NUM',
              fetchType: 2002,
              dbType: 2,
              precision: 0,
              scale: -127,
              nullable: true }
          );
          (result.metaData[1]).should.deepEqual(
            { name: 'VCH',
              fetchType: 2001,
              dbType: 1,
              byteSize: 1000,
              nullable: true }
          );
          (result.metaData[2]).should.deepEqual(
            { name: 'DT', fetchType: 2003, dbType: 12, nullable: true }
          );
          cb();
        }
      );
    };

    it("17.2.1 default value is 'false'", function(done) {
      (oracledb.extendedMetaData).should.be.false();
      verifyFalse(done);
    });

    it("17.2.2 sets to be 'true'", function(done) {
      verify(true, true, done);
    });

    it("17.2.3 works as 'false' when setting to 0", function(done) {
      verify(0, false, done);
    });

    it("17.2.4 works as 'false' when setting to 'null'", function(done) {
      verify(null, false, done);
    });

    it("17.2.5 works as 'false' when setting to 'undefined'", function(done) {
      verify(undefined, false, done);
    });

    it("17.2.6 works as 'false' when setting to 'NaN'", function(done) {
      verify(NaN, false, done);
    });

    it("17.2.7 works as 'true' when setting to a positive number", function(done) {
      verify(20, true, done);
    });

    it("17.2.8 works as 'true' when setting to a negative number", function(done) {
      verify(-2333, true, done);
    });

    it("17.2.9 works as 'true' when setting to a string", function(done) {
      verify("foobar", true, done);
    });

    it("17.2.10 can be overrided by execute() option", function(done) {

      var defaultVal = oracledb.extendedMetaData;
      async.series([
        function change(cb) {
          oracledb.extendedMetaData = true;
          cb();
        },
        function test(cb) {
          (oracledb.extendedMetaData).should.be.true();
          connection.execute(
            "SELECT * FROM nodb_md",
            [],
            { extendedMetaData: false },
            function(err, result) {
              should.not.exist(err);
              (result.metaData).should.deepEqual([ { name: 'NUM' }, { name: 'VCH' }, { name: 'DT' } ]);
              cb();
            }
          );
        },
        function restore(cb) {
          oracledb.extendedMetaData = false;
          (oracledb.extendedMetaData).should.be.equal(defaultVal);
          cb();
        }
      ], done);

    });

  }); // 17.2

  describe('17.3 data types', function() {

    before(function(done) {

      var proc = "BEGIN \n" +
                 "    DECLARE \n" +
                 "        e_table_missing EXCEPTION; \n" +
                 "        PRAGMA EXCEPTION_INIT(e_table_missing, -00942); \n" +
                 "    BEGIN \n" +
                 "        EXECUTE IMMEDIATE('DROP TABLE nodb_metadata'); \n" +
                 "    EXCEPTION \n" +
                 "        WHEN e_table_missing \n" +
                 "        THEN NULL; \n" +
                 "    END; \n" +
                 "    EXECUTE IMMEDIATE (' \n" +
                 "        CREATE TABLE nodb_metadata ( \n" +
                 "            vch         VARCHAR2(4000), \n" +
                 "            nvch        NVARCHAR2(2000), \n" +
                 "            ch          CHAR(2000), \n" +
                 "            nch         NCHAR(1000), \n" +
                 "            num1        NUMBER, \n" +
                 "            num2        NUMBER(9), \n" +
                 "            num3        NUMBER(15, 5), \n" +
                 "            num4        NUMBER(*, 1), \n" +
                 "            num5        NUMBER(7, -2), \n" +
                 "            num6        NUMERIC(23, 15), \n" +
                 "            deci1       DECIMAL, \n" +
                 "            deci2       DECIMAL(8, 18), \n" +
                 "            intenum     INTEGER, \n" +
                 "            intnum      INT, \n" +
                 "            sint        SMALLINT, \n" +
                 "            float1      FLOAT, \n" +
                 "            float2      FLOAT(90), \n" +
                 "            double      DOUBLE PRECISION, \n" +
                 "            renum       REAL, \n" +
                 "            ln          LONG, \n" +
                 "            bf          BINARY_FLOAT, \n" +
                 "            bd          BINARY_DOUBLE, \n" +
                 "            dt          DATE, \n" +
                 "            ts1         TIMESTAMP, \n" +
                 "            ts2         TIMESTAMP(5), \n" +
                 "            ts3         TIMESTAMP WITH TIME ZONE, \n" +
                 "            ts4         TIMESTAMP (2) WITH TIME ZONE, \n" +
                 "            ts5         TIMESTAMP WITH LOCAL TIME ZONE, \n" +
                 "            ts6         TIMESTAMP (9) WITH LOCAL TIME ZONE, \n" +
                 "            iym         INTERVAL YEAR TO MONTH, \n" +
                 "            ids         INTERVAL DAY TO SECOND, \n" +
                 "            rid         ROWID, \n" +
                 "            urid        UROWID, \n" +
                 "            clb         CLOB, \n" +
                 "            blb         BLOB, \n" +
                 "            nclb        NCLOB, \n" +
                 "            mybfile     BFILE, \n " +
                 "            myraw       RAW(2000) \n" +
                 "        ) \n" +
                 "    '); \n" +
                   "END; ";

      connection.execute(
        proc,
        function(err) {
          should.not.exist(err);
          return done();
        }
      );
    }); // before

    after(function(done) {
      connection.execute(
        "DROP TABLE nodb_metadata",
        function(err) {
          should.not.exist(err);
          done();
        }
      );
    });

    it('17.3.1 VARCHAR2', function(done) {

      connection.execute(
        "SELECT vch FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'VCH',
                fetchType: 2001,
                dbType: 1,
                byteSize: 4000,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.2 NVARCHAR2', function(done) {

      connection.execute(
        "SELECT nvch FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'NVCH',
                fetchType: 2001,
                dbType: 1,
                byteSize: 4000,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.3 CHAR', function(done) {

      connection.execute(
        "SELECT ch FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'CH',
                fetchType: 2001,
                dbType: 96,
                byteSize: 2000,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.4 NCHAR', function(done) {

      connection.execute(
        "SELECT ch FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'CH',
                fetchType: 2001,
                dbType: 96,
                byteSize: 2000,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.5 NUMBER', function(done) {

      connection.execute(
        "SELECT num1 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'NUM1',
                fetchType: 2002,
                dbType: 2,
                precision: 0,
                scale: -127,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.6 NUMBER(9)', function(done) {

      connection.execute(
        "SELECT num2 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'NUM2',
                fetchType: 2002,
                dbType: 2,
                precision: 9,
                scale: 0,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.7 NUMBER(15, 5)', function(done) {

      connection.execute(
        "SELECT num3 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'NUM3',
                fetchType: 2002,
                dbType: 2,
                precision: 15,
                scale: 5,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.8 NUMBER(*, 1)', function(done) {

      connection.execute(
        "SELECT num4 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'NUM4',
                fetchType: 2002,
                dbType: 2,
                precision: 38,
                scale: 1,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.9 NUMBER(7, -2)', function(done) {

      connection.execute(
        "SELECT num5 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'NUM5',
                fetchType: 2002,
                dbType: 2,
                precision: 7,
                scale: -2,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.10 NUMERIC(23, 15)', function(done) {

      connection.execute(
        "SELECT num6 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'NUM6',
                fetchType: 2002,
                dbType: 2,
                precision: 23,
                scale: 15,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.11 DECIMAL', function(done) {

      connection.execute(
        "SELECT deci1 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'DECI1',
                fetchType: 2002,
                dbType: 2,
                precision: 38,
                scale: 0,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.12 DECIMAL(8, 18)', function(done) {

      connection.execute(
        "SELECT deci2 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'DECI2',
                fetchType: 2002,
                dbType: 2,
                precision: 8,
                scale: 18,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.13 INTEGER', function(done) {

      connection.execute(
        "SELECT intenum FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'INTENUM',
                fetchType: 2002,
                dbType: 2,
                precision: 38,
                scale: 0,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.14 INT', function(done) {

      connection.execute(
        "SELECT intnum FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'INTNUM',
                fetchType: 2002,
                dbType: 2,
                precision: 38,
                scale: 0,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.15 SMALLINT', function(done) {

      connection.execute(
        "SELECT sint FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'SINT',
                fetchType: 2002,
                dbType: 2,
                precision: 38,
                scale: 0,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.16 FLOAT', function(done) {

      connection.execute(
        "SELECT float1 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'FLOAT1',
                fetchType: 2002,
                dbType: 2,
                precision: 126,
                scale: -127,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.17 FLOAT(90)', function(done) {

      connection.execute(
        "SELECT float2 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'FLOAT2',
                fetchType: 2002,
                dbType: 2,
                precision: 90,
                scale: -127,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.18 DOUBLE PRECISION', function(done) {

      connection.execute(
        "SELECT double FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'DOUBLE',
                fetchType: 2002,
                dbType: 2,
                precision: 126,
                scale: -127,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.19 REAL', function(done) {

      connection.execute(
        "SELECT renum FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'RENUM',
                fetchType: 2002,
                dbType: 2,
                precision: 63,
                scale: -127,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.20 LONG', function(done) {

      connection.execute(
        "SELECT ln FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.exist(err);
          (err.message).should.startWith('NJS-010:');
          // NJS-010: unsupported data type in select list
          done();
        }
      );

    });

    it('17.3.21 BINARY_FLOAT', function(done) {

      connection.execute(
        "SELECT bf FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'BF',
                fetchType: 2002,
                dbType: 100,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.22 BINARY_DOUBLE', function(done) {

      connection.execute(
        "SELECT bd FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'BD',
                fetchType: 2002,
                dbType: 101,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.23 DATE', function(done) {

      connection.execute(
        "SELECT dt FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'DT',
                fetchType: 2003,
                dbType: 12,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.24 TIMESTAMP', function(done) {

      connection.execute(
        "SELECT ts1 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'TS1',
                fetchType: 2003,
                dbType: 187,
                precision: 6,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.25 TIMESTAMP(5)', function(done) {

      connection.execute(
        "SELECT ts2 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'TS2',
                fetchType: 2003,
                dbType: 187,
                precision: 5,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.26 TIMESTAMP WITH TIME ZONE', function(done) {

      connection.execute(
        "SELECT ts3 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          (err.message).should.startWith('NJS-010:');
          // NJS-010: unsupported data type in select list
          done();
        }
      );

    });

    it('17.3.27 TIMESTAMP (9) WITH TIME ZONE', function(done) {

      connection.execute(
        "SELECT ts4 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          (err.message).should.startWith('NJS-010:');
          // NJS-010: unsupported data type in select list
          done();
        }
      );

    });

    it('17.3.28 TIMESTAMP WITH LOCAL TIME ZONE', function(done) {

      connection.execute(
        "SELECT ts5 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'TS5',
                fetchType: 2003,
                dbType: 232,
                precision: 6,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.29 TIMESTAMP (9) WITH LOCAL TIME ZONE', function(done) {

      connection.execute(
        "SELECT ts6 FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'TS6',
                fetchType: 2003,
                dbType: 232,
                precision: 9,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.30 INTERVAL YEAR TO MONTH', function(done) {

      connection.execute(
        "SELECT iym FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          (err.message).should.startWith('NJS-010:');
          // NJS-010: unsupported data type in select list
          done();
        }
      );

    });

    it('17.3.31 INTERVAL DAY TO SECOND', function(done) {

      connection.execute(
        "SELECT ids FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          (err.message).should.startWith('NJS-010:');
          // NJS-010: unsupported data type in select list
          done();
        }
      );

    });

    it('17.3.32 ROWID', function(done) {

      connection.execute(
        "SELECT rid FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          (err.message).should.startWith('NJS-010:');
          // NJS-010: unsupported data type in select list
          done();
        }
      );

    });

    it('17.3.33 UROWID', function(done) {

      connection.execute(
        "SELECT rid FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          (err.message).should.startWith('NJS-010:');
          // NJS-010: unsupported data type in select list
          done();
        }
      );

    });

    it('17.3.34 CLOB', function(done) {

      connection.execute(
        "SELECT clb FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'CLB',
                fetchType: 2006,
                dbType: 112,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.35 BLOB', function(done) {

      connection.execute(
        "SELECT blb FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'BLB',
                fetchType: 2007,
                dbType: 113,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.36 NCLOB', function(done) {

      connection.execute(
        "SELECT nclb FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'NCLB',
                fetchType: 2006,
                dbType: 112,
                nullable: true } ]
          );
          done();
        }
      );

    });

    it('17.3.37 BFILE', function(done) {

      connection.execute(
        "SELECT mybfile FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          (err.message).should.startWith('NJS-010:');
          // NJS-010: unsupported data type in select list
          done();
        }
      );

    });

    it('17.3.38 RAW(2000)', function(done) {

      connection.execute(
        "SELECT mybfile FROM nodb_metadata",
        [],
        { extendedMetaData: true },
        function(err, result) {
          (err.message).should.startWith('NJS-010:');
          // NJS-010: unsupported data type in select list
          done();
        }
      );

    });

  }); // 17.3

  describe('17.4 result set', function() {

    it('17.4.1 default settings', function(done) {

      connection.execute(
        "SELECT * FROM nodb_md",
        [],
        { resultSet: true },
        function(err, result) {
          should.not.exist(err);
          verifyResult(false, result.resultSet.metaData);
          done();
        }
      );

    }); // 17.4.1

    it('17.4.2 extendedMetaData option of execute() ', function(done) {

      connection.execute(
        "SELECT * FROM nodb_md",
        [],
        { resultSet: true, extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          verifyResult(true, result.resultSet.metaData);
          done();
        }
      );

    }); // 17.4.2

    it('17.4.3 global option', function(done) {

      var defaultValue = oracledb.extendedMetaData;
      async.series([
        function change(cb) {
          oracledb.extendedMetaData = true;
          cb();
        },
        function test(cb) {
          connection.execute(
            "SELECT * FROM nodb_md",
            [],
            { resultSet: true },
            function(err, result) {
              should.not.exist(err);
              verifyResult(true, result.resultSet.metaData);
              cb();
            }
          );
        },
        function restore(cb) {
          oracledb.extendedMetaData = false;
          (oracledb.extendedMetaData).should.be.equal(defaultValue);
          cb();
        }
      ], done);

    }); // 17.4.3

    it('17.4.4 REF Cursor', function(done) {

      async.series([
        function(cb) {
          var proc = "CREATE OR REPLACE PROCEDURE get_rc (p_out OUT SYS_REFCURSOR) \n" +
                     "AS \n" +
                     "BEGIN \n" +
                     "    OPEN p_out FOR \n" +
                     "        SELECT * FROM nodb_md; \n" +
                     "END; \n";

          connection.execute(
            proc,
            function(err) {
              should.not.exist(err);
              cb();
            }
          );
        },
        function(cb) {
          connection.execute(
            "BEGIN get_rc(:out); END;",
            {
              out: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            },
            { extendedMetaData: true },
            function(err, result) {
              should.not.exist(err);
              verifyResult(true, result.outBinds.out.metaData);
              cb();
            }
          );
        },
        function(cb) {
          connection.execute(
            "DROP PROCEDURE get_rc",
            function(err) {
              should.not.exist(err);
              cb();
            }
          );
        }
      ], done);

    }); // 17.4.4

  }); // 17.4

  describe('17.5 metadata event', function() {

    it('17.5.1 queryStream()', function(done) {

      var stream = connection.queryStream(
        "SELECT * FROM nodb_md",
        [],
        { extendedMetaData: true }
      );

      stream.on('metadata', function(md) {
        verifyResult(true, md);
      });

      stream.on('error', function(err) {
        should.not.exist(err);
      });

      stream.on('data', function(row) {
        should.exist(row);
      });

      stream.on('end', function() {
        return done();
      });

    });

  }); // 17.5

  describe('17.6 fetch as string', function() {

    it("17.6.1 fetchInfo - changes 'fetchType' to oracledb.STRING", function(done) {
      connection.execute(
        "SELECT * FROM nodb_md",
        [],
        {
          outFormat: oracledb.OBJECT,
          fetchInfo: {
            "DT":  { type: oracledb.STRING },
            "NUM": { type: oracledb.STRING }
          },
          extendedMetaData: true
        },
        function(err, result) {
          should.not.exist(err);
          (result.rows[0]).DT.should.be.a.String();
          (result.rows[0]).NUM.should.be.a.String();
          (result.metaData).should.deepEqual([
            { name: 'NUM',
              fetchType: 2001,
              dbType: 2,
              precision: 0,
              scale: -127,
              nullable: true },
            { name: 'VCH',
              fetchType: 2001,
              dbType: 1,
              byteSize: 1000,
              nullable: true },
            { name: 'DT', fetchType: 2001, dbType: 12, nullable: true }
          ]);
          done();
        }
      );
    });

    it("17.6.2 oracledb.fetchAsString", function(done) {

      var defaultValue = oracledb.fetchAsString;
      async.series([
        function(cb) {
          oracledb.fetchAsString = [ oracledb.DATE, oracledb.NUMBER ];
          cb();
        },
        function(cb) {
          connection.execute(
            "SELECT * FROM nodb_md",
            [],
            { outFormat: oracledb.OBJECT, extendedMetaData: true },
            function(err, result) {
              should.not.exist(err);
              (result.rows[0]).DT.should.be.a.String();
              (result.rows[0]).NUM.should.be.a.String();
              (result.metaData).should.deepEqual([
                { name: 'NUM',
                  fetchType: 2001,
                  dbType: 2,
                  precision: 0,
                  scale: -127,
                  nullable: true },
                { name: 'VCH',
                  fetchType: 2001,
                  dbType: 1,
                  byteSize: 1000,
                  nullable: true },
                { name: 'DT', fetchType: 2001, dbType: 12, nullable: true }
              ]);
              cb();
            }
          );
        },
        function(cb) {
          oracledb.fetchAsString = [];
          (oracledb.fetchAsString).should.eql(defaultValue);
          cb();
        }
      ], done);
    }); // 17.6.2

    it("17.6.3 can override at execution", function(done) {

      var defaultValue = oracledb.fetchAsString;
      async.series([
        function(cb) {
          oracledb.fetchAsString = [ oracledb.DATE, oracledb.NUMBER ];
          cb();
        },
        function(cb) {
          connection.execute(
            "SELECT * FROM nodb_md",
            [],
            { outFormat: oracledb.OBJECT,
              extendedMetaData: true,
              fetchInfo:
              {
                "DT": { type: oracledb.DEFAULT }
              }
            },
            function(err, result) {
              should.not.exist(err);
              (result.rows[0]).DT.should.be.a.Date();
              (result.rows[0]).NUM.should.be.a.String();
              (result.metaData).should.deepEqual([
                { name: 'NUM',
                  fetchType: 2001,
                  dbType: 2,
                  precision: 0,
                  scale: -127,
                  nullable: true },
                { name: 'VCH',
                  fetchType: 2001,
                  dbType: 1,
                  byteSize: 1000,
                  nullable: true },
                { name: 'DT', fetchType: 2003, dbType: 12, nullable: true }
              ]);
              cb();
            }
          );
        },
        function(cb) {
          oracledb.fetchAsString = [];
          (oracledb.fetchAsString).should.eql(defaultValue);
          cb();
        }
      ], done);
    }); // 17.6.3

  }); // 17.6

  describe("17.7 sql WITH", function() {

    it("17.7.1 works for SQL WITH statement", function(done) {

      var sqlWith = "WITH nodb_mm AS \n" +
                    "(SELECT vch, dt FROM nodb_md)  \n" +
                    "SELECT dt FROM nodb_mm";
      connection.execute(
        sqlWith,
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual(
            [ { name: 'DT', fetchType: 2003, dbType: 12, nullable: true } ]
          );
          done();
        }
      );
    });
  }); // 17.7

  describe("17.8 case sensitive columns", function() {

    it("17.8.1 works with tables whose column names are case-sensitive", function(done) {

      async.series([
        function(callback){

          var proc = "BEGIN \n" +
                     "    DECLARE \n" +
                     "        e_table_missing EXCEPTION; \n" +
                     "        PRAGMA EXCEPTION_INIT(e_table_missing, -00942);\n " +
                     "    BEGIN \n" +
                     "        EXECUTE IMMEDIATE ('DROP TABLE nodb_casesensitive'); \n" +
                     "    EXCEPTION \n" +
                     "        WHEN e_table_missing \n" +
                     "        THEN NULL; \n" +
                     "    END; \n" +
                     "    EXECUTE IMMEDIATE (' \n" +
                     "        CREATE TABLE nodb_casesensitive ( \n" +
                     "            id NUMBER,  \n" +
                     '           "nAme" VARCHAR2(20) \n' +
                     "        ) \n" +
                     "    '); \n" +
                     "END; ";

          connection.execute(
            proc,
            function(err){
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback){
          connection.execute(
            "SELECT * FROM nodb_casesensitive",
            [],
            { extendedMetaData: true },
            function(err, result) {
              should.not.exist(err);
              result.metaData[0].name.should.eql('ID');
              result.metaData[1].name.should.eql('nAme');
              (result.metaData).should.deepEqual([
                { name: 'ID',
                  fetchType: 2002,
                  dbType: 2,
                  precision: 0,
                  scale: -127,
                  nullable: true },
                { name: 'nAme',
                  fetchType: 2001,
                  dbType: 1,
                  byteSize: 20,
                  nullable: true }
              ]);
              callback();
            }
          );
        },
        function(callback){
          connection.execute(
            "DROP TABLE nodb_casesensitive",
            function(err){
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);

    });

  }); // 17.8

  describe("17.9 single character column", function(done) {

    it("17.9.1 works with column names comprised of single character", function(done) {

      var tableName = "nodb_single_char";
      var sqlCreate =
          "BEGIN \n" +
          "   DECLARE \n" +
          "       e_table_missing EXCEPTION; \n" +
          "       PRAGMA EXCEPTION_INIT(e_table_missing, -00942); \n" +
          "   BEGIN \n" +
          "       EXECUTE IMMEDIATE ('DROP TABLE " + tableName + " '); \n" +
          "   EXCEPTION \n" +
          "       WHEN e_table_missing \n" +
          "       THEN NULL; \n" +
          "   END; \n" +
          "   EXECUTE IMMEDIATE (' \n" +
          "       CREATE TABLE " + tableName +" ( \n" +
          "           a VARCHAR2(20),  \n" +
          '           b VARCHAR2(20) \n' +
          "       ) \n" +
          "   '); \n" +
          "END; \n";
      var sqlSelect = "SELECT * FROM " + tableName;
      var sqlDrop = "DROP TABLE " + tableName;

      async.series([
        function(callback) {
          connection.execute(
            sqlCreate,
            function(err){
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            sqlSelect,
            [],
            { extendedMetaData: true },
            function(err, result){
              should.not.exist(err);
              (result.metaData).should.deepEqual([
                { name: 'A',
                  fetchType: 2001,
                  dbType: 1,
                  byteSize: 20,
                  nullable: true },
                { name: 'B',
                  fetchType: 2001,
                  dbType: 1,
                  byteSize: 20,
                  nullable: true }
              ]);
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            sqlDrop,
            function(err) {
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);

    });

  }); // 17.9

  describe('17.10 duplicate column alias', function() {

    it('17.10.1 works when using duplicate column alias', function(done) {

      connection.execute(
        "SELECT 1 a, 'abc' a FROM dual",
        [],
        { extendedMetaData: true },
        function(err, result) {
          should.not.exist(err);
          (result.metaData).should.deepEqual([
            { name: 'A',
              fetchType: 2002,
              dbType: 2,
              precision: 0,
              scale: -127,
              nullable: true },
            { name: 'A',
              fetchType: 2001,
              dbType: 96,
              byteSize: 3,
              nullable: true }
          ]);
          done();
        }
      );

    });

  }); // 17.10

  describe('17.11 basic stress test', function() {

    it('17.11.1 large number of columns', function(done) {

      var column_size = 100;
      var columns_string = genColumns(column_size);

      function genColumns(size) {
        var buffer = [];
        for(var i = 0; i < size; i++) {
          buffer[i] = " column_" + i + " NUMBER";
        }
        return buffer.join();
      }

      var table_name = "nodb_large_columns";
      var sqlCreate = "CREATE TABLE " + table_name + " ( " + columns_string + " )";
      var sqlSelect = "SELECT * FROM " + table_name;
      var sqlDrop = "DROP TABLE " + table_name;

      async.series([
        function(callback) {
          connection.execute(
            sqlCreate,
            function(err){
              should.not.exist(err);
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            sqlSelect,
            [],
            { extendedMetaData: true },
            function(err, result) {
              should.not.exist(err);
              for(var i = 0; i < column_size; i++){
                result.metaData[i].name.should.eql('COLUMN_' + i);
                result.metaData[i].fetchType.should.be.exactly(2002);
                result.metaData[i].dbType.should.be.exactly(2);
                result.metaData[i].precision.should.be.exactly(0);
                result.metaData[i].scale.should.be.exactly(-127);
                result.metaData[i].nullable.should.be.true();
              }
              callback();
            }
          );
        },
        function(callback) {
          connection.execute(
            sqlDrop,
            function(err){
              should.not.exist(err);
              callback();
            }
          );
        }
      ], done);

    });

  }); // 17.11


  var verifyResult = function(setValue, md) {
    if(!setValue) {
      md.should.deepEqual(
        [ { name: 'NUM' }, { name: 'VCH' }, { name: 'DT' } ]
      );
    }
    else {
      md.should.deepEqual([
        { name: 'NUM',
          fetchType: 2002,
          dbType: 2,
          precision: 0,
          scale: -127,
          nullable: true },
        { name: 'VCH',
          fetchType: 2001,
          dbType: 1,
          byteSize: 1000,
          nullable: true },
        { name: 'DT', fetchType: 2003, dbType: 12, nullable: true }
      ]);
    }
  };

});
