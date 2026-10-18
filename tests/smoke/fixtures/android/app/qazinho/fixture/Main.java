package app.qazinho.fixture;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class Main extends Activity {
  @Override
  protected void onCreate(Bundle saved) {
    super.onCreate(saved);
    final SharedPreferences prefs = getSharedPreferences("visits", MODE_PRIVATE);
    final TextView count = new TextView(this);
    count.setTextSize(24);
    count.setText("Visits: " + prefs.getInt("visits", 0));
    Button keep = new Button(this);
    keep.setText("Save visit");
    keep.setOnClickListener(new View.OnClickListener() {
      @Override
      public void onClick(View view) {
        int next = prefs.getInt("visits", 0) + 1;
        prefs.edit().putInt("visits", next).commit();
        count.setText("Visits: " + next);
      }
    });
    LinearLayout layout = new LinearLayout(this);
    layout.setOrientation(LinearLayout.VERTICAL);
    layout.setPadding(48, 160, 48, 48);
    layout.addView(count);
    layout.addView(keep);
    setContentView(layout);
  }
}
