package app.qazinho.fixture;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
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
    final TextView hold = new TextView(this);
    hold.setTextSize(20);
    hold.setPadding(0, 32, 0, 32);
    hold.setText("Hold me");
    hold.setOnLongClickListener(new View.OnLongClickListener() {
      @Override
      public boolean onLongClick(View view) {
        hold.setText("Held long");
        return true;
      }
    });
    EditText note = new EditText(this);
    note.setSingleLine(true);
    note.setContentDescription("Note");
    LinearLayout layout = new LinearLayout(this);
    layout.setOrientation(LinearLayout.VERTICAL);
    layout.setPadding(48, 160, 48, 48);
    layout.addView(count);
    layout.addView(keep);
    layout.addView(hold);
    layout.addView(note);
    for (int row = 1; row <= 40; row++) {
      TextView line = new TextView(this);
      line.setTextSize(20);
      line.setPadding(0, 24, 0, 24);
      line.setText("Row " + row);
      layout.addView(line);
    }
    ScrollView scroll = new ScrollView(this);
    scroll.addView(layout);
    setContentView(scroll);
  }
}
