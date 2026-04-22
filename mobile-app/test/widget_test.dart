// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:rakt_connect_mobile/main.dart';

void main() {
  testWidgets('Dashboard smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const RaktConnectApp());

    // Verify that the app title 'Rakt-Connect' is present.
    expect(find.text('Rakt-Connect'), findsAtLeastNWidgets(1));

    // Verify that the donor name 'Rajesh K.' is present.
    expect(find.text('Rajesh K.'), findsOneWidget);

    // Verify that the blood group 'O-' is present.
    expect(find.text('O-'), findsOneWidget);

    // Verify navigation bar labels
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Emergency'), findsOneWidget);
    expect(find.text('Scan'), findsOneWidget);
    expect(find.text('History'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });
}
