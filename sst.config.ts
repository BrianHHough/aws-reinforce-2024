import { SSTConfig } from "sst";
import { NextjsSite, Api, Cognito, Bucket, Table, Function } from "sst/constructs";
import { Tags } from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";

// Global variables
const custom = {
  projectName: "testtesting-next-sst-deploy",
  owner: "Your_Team_Name_Here",
  version: "1_0_0",
  purpose: "Serverless photo gallery API",
}

export default {
  config(_input) {
    return {
      name: "my-serverless-app-",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(({ stack, app }) => {
      // =================================== //
      //    V1: Create a CDN for the App     //
      // =================================== //
      const site = new NextjsSite(stack, "site"); 

      // Customize CloudFront settings
      // customDomain: {
      //   domainNames: ["yourdomain.com"];
      //   domainAlias: "www.yourdomain.com"
      // }

      // =================================== //
      //          V2: CDN with WAF           //
      // 

      // const site = new NextjsSite(stack, "site", {
      //   path: "/app",
      //   customDomain: {
      //     domainName: "yourdomain.com",
      //     domainAlias: "www.yourdomain.com"
      //   },
      //   cdn: {
      //     distribution: {
      //       webAclId: waf.attrArn,
      //     }
      //   }
      // });

      // =================================== //
      //      Create a WAF for the App       //
      // =================================== //
      // const waf = new wafv2.CfnWebACL(stack, "WebACL", {
      //   defaultAction: {
      //     allow: {}
      //   },
      //   scope: 'CLOUDFRONT',
      //   visibilityConfig: {
      //     cloudWatchMetricsEnabled: true,
      //     sampledRequestsEnabled: true,
      //     metricName: "wafv2"
      //   },
      //   rules: [
      //     {
      //       name: "AWS-AWSManagedRulesCommonRuleSet",
      //       priority: 1,
      //       overrideAction: { none: {} },
      //       statement: {
      //         managedRuleGroupStatement: {
      //           vendorName: "AWS",
      //           name: "AWSManagedRulesCommonRuleSet",
      //         }
      //       },
      //       visibilityConfig: {
      //         cloudWatchMetricsEnabled: true,
      //         sampledRequestsEnabled: true,
      //         metricName: "CommonRuleSetMetric"
      //       }
      //     }
      //   ]
      // });


      // =================================== //
      //   Configure S3 Bucket for Photos    //
      // =================================== //
      const photoBucket = new Bucket(stack, "PhotoBucket");


      // =================================== //
      //   Create a Cognito Auth Resource    //
      // =================================== //
      const auth = new Cognito(stack, "Auth", {
        login: ["email"],
      });


      // =================================== //
      //      Configure DynamoDB Table       //
      // =================================== //
      const photoGalleryTable = new Table(stack, "PhotoGalleryTable", {
        fields: {
          id: "string",
          order: "number",
          fileName: "string",
          imageUrl: "string",
          description: "string",
          uuid: "string"
        },
        primaryIndex: { partitionKey: "id", sortKey: "order" },
        globalIndexes: {
          OrderIndex: { partitionKey: "order" } // Need to query by PK
        }
      });


      // =================================== //
      //   Create an API Gateway HTTP API    //
      // =================================== //
      const api = new Api(stack, "Api", {
        authorizers: {
          cognitoAuthorizer: {
            type: "user_pool",
            userPool: {
              id: auth.userPoolId,
              clientIds: [auth.userPoolClientId],
            },
          },
        },
        defaults: {
          authorizer: "cognitoAuthorizer",
          authorizationScopes: ["user.email"]
        },
        routes: {
          "GET /photos": {
            function: {
              handler: "app/api/photos/list/route.main",
              environment: {
                TableName: photoGalleryTable.tableName,
              }
            },
          },
          "GET /admin/presign": {
            authorizer: "iam",
            function: {
              handler: "app/api/photos/presign/route.main",
              environment: {
                BUCKET_NAME: photoBucket.bucketName,
              },
            },
          },
          "POST /admin/upload": {
            authorizer: "cognitoAuthorizer",
            function: {
              handler: "app/api/photos/upload/route.main",
              environment: {
                TableName: photoGalleryTable.tableName,
                BUCKET_NAME: photoBucket.bucketName,
              }
            },
          },
          // "DELETE /admin/delete": {
          //   authorizer: "cognitoAuthorizer",
          //   function: {
          //     handler: "app/api/photos/delete/route.main",
          //     environment: {
          //       TableName: photoGalleryTable.tableName,
          //       BUCKET_NAME: photoBucket.bucketName,
          //     }
          //   },
          // }
        },
      });

      // Add permissions for presign URL function
      const presignFunction = new Function(stack, "GeneratePresignedUrl", {
        handler: "app/api/photos/presign/route.main",
        environment: {
          BUCKET_NAME: photoBucket.bucketName,
        },
      });
      photoBucket.grantReadWrite(presignFunction);


      // =================================== //
      //     Add Permissions to Resources    //
      // =================================== //
      // Let photos/upload access: DynamoDB -- for photos
      api.getFunction("GET /photos")?.attachPermissions([photoGalleryTable]);
      // Let photos/upload access: DynamoDB, S3 -- for photos
      api.getFunction("POST /admin/upload")?.attachPermissions([photoGalleryTable, photoBucket]);

      photoBucket


      // =================================== //
      //      Add Tags to all Resources      //
      // =================================== //
      Tags.of(stack).add("Project", custom.projectName);
      Tags.of(stack).add("Environment", app.stage);
      Tags.of(stack).add("Owner", custom.owner);
      Tags.of(stack).add("Version", custom.version);
      Tags.of(stack).add("CostCenter", custom.projectName);
      Tags.of(stack).add("Purpose", custom.purpose);
      
      stack.addOutputs({
        SiteUrl: site.url,
        ApiEndpoint: api.url,
        BucketName: photoBucket.bucketName,
        UserPoolId: auth.userPoolId,
        IdentityPoolId: auth.cognitoIdentityPoolId,
        UserPoolClientId: auth.userPoolClientId,
        TableName: photoGalleryTable.tableName,
      });
      // =================================== //
      //        Customize Stack Name         //
      // =================================== //
    }, { stackName: `${custom.projectName}-${app.stage}` }); 
  },
} satisfies SSTConfig;
