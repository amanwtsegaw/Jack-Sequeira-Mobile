#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface AppInfo : NSObject <RCTBridgeModule>
@end

@implementation AppInfo

RCT_EXPORT_MODULE();

- (NSDictionary *)constantsToExport
{
  NSString *version = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  return @{@"version": version ?: @"1.0"};
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
