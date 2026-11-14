package demo.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public final class LoginPage {
    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    private static final By EMAIL = By.id("email");
    private static final By PASSWORD = By.id("password");
    private static final By SUBMIT = By.cssSelector("[data-testid='login-button']");
    private static final By DASHBOARD = By.cssSelector("[data-testid='dashboard-heading']");
    private static final By ERROR = By.cssSelector("[data-testid='login-error']");

    public LoginPage(WebDriver driver, String baseUrl, Duration timeout) {
        this.driver = driver;
        this.baseUrl = baseUrl;
        this.wait = new WebDriverWait(driver, timeout);
    }

    public void open() {
        driver.get(baseUrl + "/login");
        wait.until(ExpectedConditions.visibilityOfElementLocated(EMAIL));
    }

    public void login(String email, String password) {
        fillInput(EMAIL, email);
        fillInput(PASSWORD, password);
        wait.until(ExpectedConditions.elementToBeClickable(SUBMIT)).click();
    }

    public String waitForDashboardText(String expected) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(DASHBOARD));
        wait.until(ExpectedConditions.textToBe(DASHBOARD, expected));
        return driver.findElement(DASHBOARD).getText();
    }

    public String waitForErrorText(String expected) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(ERROR));
        wait.until(ExpectedConditions.textToBe(ERROR, expected));
        return driver.findElement(ERROR).getText();
    }

    private void fillInput(By locator, String value) {
        if (value == null) {
            throw new IllegalArgumentException("Giá trị nhập không được là null");
        }
        WebElement input = wait.until(
                ExpectedConditions.visibilityOfElementLocated(locator));
        input.clear();
        input.sendKeys(value);
    }
}
