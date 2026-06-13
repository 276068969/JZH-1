package com.carrental.exception;

public class BusinessException extends RuntimeException {
    private final int code;
    private final String field;

    public BusinessException(String message) {
        super(message);
        this.code = 400;
        this.field = null;
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
        this.field = null;
    }

    public BusinessException(int code, String message, String field) {
        super(message);
        this.code = code;
        this.field = field;
    }

    public int getCode() {
        return code;
    }

    public String getField() {
        return field;
    }
}
