#import <UIKit/UIKit.h>

@interface Counter : UIViewController
@property(nonatomic, strong) UILabel *count;
@property(nonatomic, strong) UILabel *hold;
@property(nonatomic, strong) UILabel *noted;
@end

@implementation Counter
- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = UIColor.systemBackgroundColor;
  self.count = [[UILabel alloc] initWithFrame:CGRectMake(40, 160, 300, 40)];
  self.count.font = [UIFont systemFontOfSize:24];
  [self show];
  UIButton *keep = [UIButton buttonWithType:UIButtonTypeSystem];
  keep.frame = CGRectMake(40, 220, 200, 44);
  [keep setTitle:@"Save visit" forState:UIControlStateNormal];
  [keep addTarget:self action:@selector(save) forControlEvents:UIControlEventTouchUpInside];
  UIScrollView *scroll = [[UIScrollView alloc] initWithFrame:self.view.bounds];
  scroll.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self.view addSubview:scroll];
  [scroll addSubview:self.count];
  [scroll addSubview:keep];
  self.hold = [[UILabel alloc] initWithFrame:CGRectMake(40, 280, 300, 40)];
  self.hold.text = @"Hold me";
  self.hold.userInteractionEnabled = YES;
  [self.hold addGestureRecognizer:[[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(held:)]];
  [scroll addSubview:self.hold];
  UITextField *note = [[UITextField alloc] initWithFrame:CGRectMake(40, 330, 300, 40)];
  note.accessibilityLabel = @"Note";
  note.borderStyle = UITextBorderStyleRoundedRect;
  note.autocorrectionType = UITextAutocorrectionTypeNo;
  note.autocapitalizationType = UITextAutocapitalizationTypeNone;
  note.smartQuotesType = UITextSmartQuotesTypeNo;
  note.smartDashesType = UITextSmartDashesTypeNo;
  note.smartInsertDeleteType = UITextSmartInsertDeleteTypeNo;
  [note addTarget:self action:@selector(noted:) forControlEvents:UIControlEventEditingChanged];
  [scroll addSubview:note];
  self.noted = [[UILabel alloc] initWithFrame:CGRectMake(40, 380, 300, 40)];
  self.noted.text = @"Noted:";
  [scroll addSubview:self.noted];
  for (NSInteger row = 1; row <= 40; row++) {
    UILabel *line = [[UILabel alloc] initWithFrame:CGRectMake(40, 440 + (row - 1) * 50, 300, 40)];
    line.text = [NSString stringWithFormat:@"Row %ld", (long)row];
    [scroll addSubview:line];
  }
  scroll.contentSize = CGSizeMake(self.view.bounds.size.width, 440 + 40 * 50 + 120);
}
- (void)noted:(UITextField *)note {
  self.noted.text = [@"Noted: " stringByAppendingString:note.text];
}
- (void)held:(UILongPressGestureRecognizer *)press {
  if (press.state == UIGestureRecognizerStateBegan) self.hold.text = @"Held long";
}
- (void)show {
  self.count.text = [NSString stringWithFormat:@"Visits: %ld", (long)[NSUserDefaults.standardUserDefaults integerForKey:@"visits"]];
}
- (void)save {
  NSInteger next = [NSUserDefaults.standardUserDefaults integerForKey:@"visits"] + 1;
  [NSUserDefaults.standardUserDefaults setInteger:next forKey:@"visits"];
  [NSUserDefaults.standardUserDefaults synchronize];
  [self show];
}
@end

@interface Scene : UIResponder <UIWindowSceneDelegate>
@property(nonatomic, strong) UIWindow *window;
@end

@implementation Scene
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
  self.window = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
  self.window.rootViewController = [Counter new];
  [self.window makeKeyAndVisible];
}
@end

@interface App : UIResponder <UIApplicationDelegate>
@end

@implementation App
- (UISceneConfiguration *)application:(UIApplication *)application configurationForConnectingSceneSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
  UISceneConfiguration *configuration = [[UISceneConfiguration alloc] initWithName:@"Default" sessionRole:session.role];
  configuration.delegateClass = [Scene class];
  return configuration;
}
@end

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([App class]));
  }
}
