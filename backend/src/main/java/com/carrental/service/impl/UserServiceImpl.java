package com.carrental.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.carrental.dto.RegisterRequestDTO;
import com.carrental.dto.RegisterResponseVO;
import com.carrental.entity.User;
import com.carrental.exception.BusinessException;
import com.carrental.mapper.UserMapper;
import com.carrental.service.UserService;
import com.carrental.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    private static final Pattern ID_CARD_PATTERN = Pattern.compile(
        "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$"
    );
    private static final Pattern LICENSE_PATTERN = Pattern.compile(
        "^[A-Za-z0-9]{8,20}$"
    );
    private static final Pattern CREDIT_CODE_PATTERN = Pattern.compile(
        "^[0-9A-HJ-NPQRTUWXY]{2}\\d{6}[0-9A-HJ-NPQRTUWXY]{10}$"
    );
    private static final Pattern USERNAME_PATTERN = Pattern.compile(
        "^[A-Za-z0-9_\\u4e00-\\u9fa5]{3,20}$"
    );
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
        "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&_.-]{6,32}$"
    );

    private static final List<String> PERSONAL_REQUIRED = Arrays.asList(
        "username", "password", "email", "phone", "idCard", "licenseNumber"
    );
    private static final List<String> ENTERPRISE_REQUIRED = Arrays.asList(
        "username", "password", "email", "phone", "companyName", "creditCode",
        "legalPersonName", "legalPersonIdCard"
    );

    private static final Map<String, String> FIELD_LABELS;
    static {
        FIELD_LABELS = new HashMap<>();
        FIELD_LABELS.put("username", "用户名");
        FIELD_LABELS.put("password", "密码");
        FIELD_LABELS.put("confirmPassword", "确认密码");
        FIELD_LABELS.put("email", "邮箱");
        FIELD_LABELS.put("phone", "手机号");
        FIELD_LABELS.put("userType", "账户类型");
        FIELD_LABELS.put("idCard", "身份证号");
        FIELD_LABELS.put("licenseNumber", "驾驶证号");
        FIELD_LABELS.put("companyName", "公司全称");
        FIELD_LABELS.put("creditCode", "统一社会信用代码");
        FIELD_LABELS.put("legalPersonName", "法人代表姓名");
        FIELD_LABELS.put("legalPersonIdCard", "法人身份证号");
    }

    @Override
    @Deprecated
    public User register(String username, String password, String email, String phone, String userType) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        if (this.getOne(wrapper) != null) {
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setPhone(phone);
        user.setUserType(userType);
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());

        this.save(user);
        return user;
    }

    @Override
    public RegisterResponseVO register(RegisterRequestDTO request) {
        List<RegisterResponseVO.FieldError> fieldErrors = new ArrayList<>();

        validateBasics(request, fieldErrors);

        String userType = normalizeUserType(request.getUserType());
        boolean isEnterprise = "enterprise".equals(userType);

        if (isEnterprise) {
            validateEnterpriseFields(request, fieldErrors);
        } else {
            validatePersonalFields(request, fieldErrors);
        }

        if (!fieldErrors.isEmpty()) {
            return buildValidationError(fieldErrors, userType, request);
        }

        checkUniqueness(request, fieldErrors);
        if (!fieldErrors.isEmpty()) {
            return buildValidationError(fieldErrors, userType, request);
        }

        User user = new User();
        user.setUsername(trim(request.getUsername()));
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(trim(request.getEmail()).toLowerCase());
        user.setPhone(trim(request.getPhone()));
        user.setUserType(userType);

        if (isEnterprise) {
            user.setCompanyName(trim(request.getCompanyName()));
            user.setCreditCode(trim(request.getCreditCode()).toUpperCase());
            user.setLegalPersonName(trim(request.getLegalPersonName()));
            user.setLegalPersonIdCard(trim(request.getLegalPersonIdCard()).toUpperCase());
        } else {
            user.setIdCard(trim(request.getIdCard()).toUpperCase());
            user.setLicenseNumber(trim(request.getLicenseNumber()).toUpperCase());
        }

        user.setProfileComplete(1);
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());

        try {
            this.save(user);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("Duplicate")) {
                detectDuplicateFromException(e.getMessage(), fieldErrors);
                if (!fieldErrors.isEmpty()) {
                    return buildValidationError(fieldErrors, userType, request);
                }
            }
            throw new BusinessException(500, "注册失败，请稍后重试：" + e.getMessage());
        }

        RegisterResponseVO.UserInfo userInfo = RegisterResponseVO.UserInfo.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .phone(user.getPhone())
            .userType(user.getUserType())
            .build();

        RegisterResponseVO.ProfileInfo profileInfo = buildProfileInfo(userType, request, true, fieldErrors);

        String successMsg = isEnterprise
            ? "企业账户注册成功，请使用企业租车申请通道提交用车需求"
            : "个人账户注册成功，请完成驾照核验后即可下单";

        return RegisterResponseVO.builder()
            .code(200)
            .success(true)
            .message(successMsg)
            .data(userInfo)
            .profile(profileInfo)
            .fieldErrors(null)
            .build();
    }

    @Override
    public String login(String username, String password) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User user = this.getOne(wrapper);

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        return jwtUtil.generateToken(user.getUsername());
    }

    private void validateBasics(RegisterRequestDTO req, List<RegisterResponseVO.FieldError> errors) {
        if (!StringUtils.hasText(req.getUsername())) {
            errors.add(err("username", "请输入用户名"));
        } else if (!USERNAME_PATTERN.matcher(req.getUsername().trim()).matches()) {
            errors.add(err("username", "用户名需为 3-20 位字母、数字、下划线或中文"));
        }

        if (!StringUtils.hasText(req.getPassword())) {
            errors.add(err("password", "请输入密码"));
        } else if (!PASSWORD_PATTERN.matcher(req.getPassword()).matches()) {
            errors.add(err("password", "密码需 6-32 位且包含字母和数字"));
        }

        if (!StringUtils.hasText(req.getConfirmPassword())) {
            errors.add(err("confirmPassword", "请再次输入密码"));
        } else if (StringUtils.hasText(req.getPassword())
                && !req.getPassword().equals(req.getConfirmPassword())) {
            errors.add(err("confirmPassword", "两次输入的密码不一致"));
        }

        if (!StringUtils.hasText(req.getEmail())) {
            errors.add(err("email", "请输入邮箱"));
        } else if (!EMAIL_PATTERN.matcher(req.getEmail().trim()).matches()) {
            errors.add(err("email", "邮箱格式不正确，例如 name@example.com"));
        }

        if (!StringUtils.hasText(req.getPhone())) {
            errors.add(err("phone", "请输入手机号"));
        } else if (!PHONE_PATTERN.matcher(req.getPhone().trim()).matches()) {
            errors.add(err("phone", "请输入有效的 11 位中国大陆手机号"));
        }

        if (!StringUtils.hasText(req.getUserType())) {
            errors.add(err("userType", "请选择账户类型"));
        } else {
            String t = normalizeUserType(req.getUserType());
            if (t == null) {
                errors.add(err("userType", "账户类型只能是 personal 或 enterprise"));
            }
        }
    }

    private void validatePersonalFields(RegisterRequestDTO req, List<RegisterResponseVO.FieldError> errors) {
        if (!StringUtils.hasText(req.getIdCard())) {
            errors.add(err("idCard", "个人用户需提供身份证号"));
        } else if (!ID_CARD_PATTERN.matcher(req.getIdCard().trim()).matches()) {
            errors.add(err("idCard", "身份证号格式不正确（18 位）"));
        } else if (!validateIdCardChecksum(req.getIdCard().trim())) {
            errors.add(err("idCard", "身份证号校验位不正确"));
        }

        if (!StringUtils.hasText(req.getLicenseNumber())) {
            errors.add(err("licenseNumber", "个人用户需提供机动车驾驶证号"));
        } else if (!LICENSE_PATTERN.matcher(req.getLicenseNumber().trim()).matches()) {
            errors.add(err("licenseNumber", "驾驶证号格式不正确（8-20 位字母或数字）"));
        }
    }

    private void validateEnterpriseFields(RegisterRequestDTO req, List<RegisterResponseVO.FieldError> errors) {
        if (!StringUtils.hasText(req.getCompanyName())) {
            errors.add(err("companyName", "企业用户需填写公司全称"));
        } else if (req.getCompanyName().trim().length() < 4) {
            errors.add(err("companyName", "公司名称至少 4 个字符"));
        }

        if (!StringUtils.hasText(req.getCreditCode())) {
            errors.add(err("creditCode", "企业用户需提供统一社会信用代码"));
        } else if (!CREDIT_CODE_PATTERN.matcher(req.getCreditCode().trim().toUpperCase()).matches()) {
            errors.add(err("creditCode", "统一社会信用代码格式不正确（18 位）"));
        }

        if (!StringUtils.hasText(req.getLegalPersonName())) {
            errors.add(err("legalPersonName", "请填写法人代表姓名"));
        } else if (req.getLegalPersonName().trim().length() < 2) {
            errors.add(err("legalPersonName", "法人代表姓名至少 2 个字符"));
        }

        if (!StringUtils.hasText(req.getLegalPersonIdCard())) {
            errors.add(err("legalPersonIdCard", "请填写法人代表身份证号"));
        } else if (!ID_CARD_PATTERN.matcher(req.getLegalPersonIdCard().trim()).matches()) {
            errors.add(err("legalPersonIdCard", "法人代表身份证号格式不正确（18 位）"));
        } else if (!validateIdCardChecksum(req.getLegalPersonIdCard().trim())) {
            errors.add(err("legalPersonIdCard", "法人代表身份证号校验位不正确"));
        }
    }

    private void checkUniqueness(RegisterRequestDTO req, List<RegisterResponseVO.FieldError> errors) {
        String username = trim(req.getUsername());
        String email = trim(req.getEmail()).toLowerCase();
        String phone = trim(req.getPhone());

        LambdaQueryWrapper<User> w;
        w = new LambdaQueryWrapper<>();
        w.eq(User::getUsername, username);
        if (this.getOne(w) != null) {
            errors.add(err("username", "该用户名已被注册，请更换"));
        }

        w = new LambdaQueryWrapper<>();
        w.eq(User::getEmail, email);
        if (this.getOne(w) != null) {
            errors.add(err("email", "该邮箱已被注册，可直接登录或找回密码"));
        }

        w = new LambdaQueryWrapper<>();
        w.eq(User::getPhone, phone);
        if (this.getOne(w) != null) {
            errors.add(err("phone", "该手机号已被注册，可直接登录或找回密码"));
        }

        if ("enterprise".equals(normalizeUserType(req.getUserType()))) {
            String creditCode = trim(req.getCreditCode()).toUpperCase();
            w = new LambdaQueryWrapper<>();
            w.eq(User::getCreditCode, creditCode);
            if (this.getOne(w) != null) {
                errors.add(err("creditCode", "该统一社会信用代码已关联账户，请联系管理员"));
            }
        } else {
            String idCard = trim(req.getIdCard()).toUpperCase();
            w = new LambdaQueryWrapper<>();
            w.eq(User::getIdCard, idCard);
            if (this.getOne(w) != null) {
                errors.add(err("idCard", "该身份证号已被注册"));
            }

            String license = trim(req.getLicenseNumber()).toUpperCase();
            w = new LambdaQueryWrapper<>();
            w.eq(User::getLicenseNumber, license);
            if (this.getOne(w) != null) {
                errors.add(err("licenseNumber", "该驾驶证号已被注册"));
            }
        }
    }

    private void detectDuplicateFromException(String msg, List<RegisterResponseVO.FieldError> errors) {
        if (msg.contains("idx_username")) {
            errors.add(err("username", "该用户名已被注册，请更换"));
        } else if (msg.contains("idx_email")) {
            errors.add(err("email", "该邮箱已被注册"));
        } else if (msg.contains("idx_phone")) {
            errors.add(err("phone", "该手机号已被注册"));
        } else if (msg.contains("idx_id_card")) {
            errors.add(err("idCard", "该身份证号已被注册"));
        } else if (msg.contains("idx_license_number")) {
            errors.add(err("licenseNumber", "该驾驶证号已被注册"));
        } else if (msg.contains("idx_credit_code")) {
            errors.add(err("creditCode", "该统一社会信用代码已被注册"));
        }
    }

    private RegisterResponseVO buildValidationError(
        List<RegisterResponseVO.FieldError> errors,
        String userType,
        RegisterRequestDTO request
    ) {
        return RegisterResponseVO.builder()
            .code(422)
            .success(false)
            .message("注册资料校验未通过，请检查以下字段")
            .data(null)
            .fieldErrors(errors)
            .profile(buildProfileInfo(userType, request, false, errors))
            .build();
    }

    private RegisterResponseVO.ProfileInfo buildProfileInfo(
        String userType,
        RegisterRequestDTO req,
        boolean forceComplete,
        List<RegisterResponseVO.FieldError> errors
    ) {
        List<String> required = "enterprise".equals(userType) ? ENTERPRISE_REQUIRED : PERSONAL_REQUIRED;
        List<String> missing = new ArrayList<>();
        for (String f : required) {
            Object v = getFieldValue(req, f);
            if (v == null || !StringUtils.hasText(v.toString())) {
                missing.add(f);
            }
        }

        List<String> invalidFields = new ArrayList<>();
        if (errors != null) {
            for (RegisterResponseVO.FieldError fe : errors) {
                invalidFields.add(fe.getField());
                if (!missing.contains(fe.getField()) && required.contains(fe.getField())) {
                    missing.add(fe.getField());
                }
            }
        }

        boolean hasAnyError = errors != null && !errors.isEmpty();
        boolean complete = !hasAnyError && (forceComplete || (missing.isEmpty() && invalidFields.isEmpty()));

        String hint;
        if (hasAnyError) {
            if ("enterprise".equals(userType)) {
                hint = String.format(
                    "企业资质存在 %d 项问题，请修正标红字段后重新提交（%s）",
                    errors.size(),
                    joinFieldLabels(invalidFields)
                );
            } else {
                hint = String.format(
                    "实名信息存在 %d 项问题，请修正标红字段后重新提交（%s）",
                    errors.size(),
                    joinFieldLabels(invalidFields)
                );
            }
        } else if ("enterprise".equals(userType)) {
            hint = complete
                ? "资料完整，可前往企业用车通道申请批量租车服务"
                : "请补充企业资质信息后再提交申请：缺少 " + joinFieldLabels(missing);
        } else {
            hint = complete
                ? "资料完整，可直接浏览车辆并下单"
                : "请补充身份证和驾驶证信息后再进行租车：缺少 " + joinFieldLabels(missing);
        }

        return RegisterResponseVO.ProfileInfo.builder()
            .userType(userType)
            .complete(complete)
            .requiredFields(required)
            .missingFields(missing)
            .nextStepHint(hint)
            .build();
    }

    private static Object getFieldValue(RegisterRequestDTO req, String field) {
        switch (field) {
            case "username": return req.getUsername();
            case "password": return req.getPassword();
            case "email": return req.getEmail();
            case "phone": return req.getPhone();
            case "idCard": return req.getIdCard();
            case "licenseNumber": return req.getLicenseNumber();
            case "companyName": return req.getCompanyName();
            case "creditCode": return req.getCreditCode();
            case "legalPersonName": return req.getLegalPersonName();
            case "legalPersonIdCard": return req.getLegalPersonIdCard();
            default: return null;
        }
    }

    private static boolean validateIdCardChecksum(String id) {
        if (id == null || id.length() != 18) return false;
        int[] weights = {7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2};
        char[] codes = {'1','0','X','9','8','7','6','5','4','3','2'};
        int sum = 0;
        for (int i = 0; i < 17; i++) {
            char c = id.charAt(i);
            if (c < '0' || c > '9') return false;
            sum += (c - '0') * weights[i];
        }
        char expected = codes[sum % 11];
        char actual = Character.toUpperCase(id.charAt(17));
        return expected == actual;
    }

    private static String normalizeUserType(String t) {
        if (t == null) return null;
        switch (t.trim().toLowerCase()) {
            case "personal":
            case "个人":
            case "个人用户":
                return "personal";
            case "enterprise":
            case "企业":
            case "企业用户":
                return "enterprise";
            default:
                return null;
        }
    }

    private static RegisterResponseVO.FieldError err(String field, String msg) {
        return RegisterResponseVO.FieldError.builder().field(field).message(msg).build();
    }

    private static String trim(String s) {
        return s == null ? "" : s.trim();
    }

    private static String joinFieldLabels(List<String> fields) {
        if (fields == null || fields.isEmpty()) return "";
        List<String> labels = new ArrayList<>();
        for (String f : fields) {
            String label = FIELD_LABELS.get(f);
            labels.add(label != null ? label : f);
        }
        return String.join("、", labels);
    }
}
