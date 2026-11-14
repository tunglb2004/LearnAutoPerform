package demo.tests;

import demo.config.TestConfig;
import demo.pages.LoginPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvFileSource;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LoginTest {
    private WebDriver driver;
    private LoginPage loginPage;

    @BeforeEach
    void setUp() {
        TestConfig config = TestConfig.fromEnv();
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--window-size=1280,800");
        if (config.headless) {
            options.addArguments("--headless=new");
        }

        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ZERO);
        driver.manage().timeouts().pageLoadTimeout(config.uiTimeout);
        loginPage = new LoginPage(driver, config.baseUrl, config.uiTimeout);
        loginPage.open();
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    void validLogin() {
        loginPage.login("user@example.test", "Password123!");
        String expected = "Chào mừng";
        assertEquals(expected, loginPage.waitForDashboardText(expected));
    }

    @Test
    void incorrectPassword() {
        loginPage.login("user@example.test", "incorrect");
        String expected = "Email hoặc mật khẩu không đúng";
        assertEquals(expected, loginPage.waitForErrorText(expected));
    }

    @ParameterizedTest(name = "missing credentials - case {index}")
    @CsvFileSource(
            resources = "/login-missing.csv",
            numLinesToSkip = 1,
            encoding = "UTF-8",
            emptyValue = ""
    )
    void missingCredentials(String email, String password, String expectedError) {
        loginPage.login(email, password);
        assertEquals(expectedError, loginPage.waitForErrorText(expectedError));
    }
}
