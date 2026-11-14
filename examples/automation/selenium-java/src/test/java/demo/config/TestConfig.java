package demo.config;

import java.net.URI;
import java.time.Duration;

public final class TestConfig {
    public final String baseUrl;
    public final Duration uiTimeout;
    public final boolean headless;

    private TestConfig(String baseUrl, Duration uiTimeout, boolean headless) {
        this.baseUrl = baseUrl;
        this.uiTimeout = uiTimeout;
        this.headless = headless;
    }

    public static TestConfig fromEnv() {
        String rawBaseUrl = readString("BASE_URL", "http://127.0.0.1:3000");
        URI uri;
        try {
            uri = URI.create(rawBaseUrl);
        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("BASE_URL không phải URL hợp lệ", error);
        }

        boolean validScheme = "http".equalsIgnoreCase(uri.getScheme())
                || "https".equalsIgnoreCase(uri.getScheme());
        String path = uri.getPath();
        if (!validScheme || uri.getHost() == null
                || uri.getUserInfo() != null || uri.getQuery() != null
                || uri.getFragment() != null
                || (path != null && !path.isEmpty() && !"/".equals(path))) {
            throw new IllegalArgumentException(
                    "BASE_URL cần là origin http(s), ví dụ http://127.0.0.1:3000");
        }

        String baseUrl = rawBaseUrl.replaceAll("/+$", "");
        int seconds = readInteger("UI_TIMEOUT_SECONDS", 10, 1, 120);
        boolean headless = readBoolean("HEADLESS", true);
        return new TestConfig(baseUrl, Duration.ofSeconds(seconds), headless);
    }

    private static String readString(String name, String fallback) {
        String raw = System.getenv(name);
        String value = raw == null ? fallback : raw.trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException(name + " không được để trống");
        }
        return value;
    }

    private static int readInteger(String name, int fallback, int min, int max) {
        String raw = readString(name, Integer.toString(fallback));
        if (!raw.matches("[0-9]+")) {
            throw new IllegalArgumentException(name + " phải là số nguyên");
        }
        try {
            int value = Integer.parseInt(raw);
            if (value < min || value > max) {
                throw new IllegalArgumentException(
                        name + " phải từ " + min + " đến " + max);
            }
            return value;
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException(name + " nằm ngoài khoảng số hợp lệ", error);
        }
    }

    private static boolean readBoolean(String name, boolean fallback) {
        String raw = readString(name, Boolean.toString(fallback));
        if ("true".equalsIgnoreCase(raw)) return true;
        if ("false".equalsIgnoreCase(raw)) return false;
        throw new IllegalArgumentException(name + " chỉ nhận true hoặc false");
    }
}
