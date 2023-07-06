<div class="main-logo-text">
<script type="text/javascript" charset="utf-8" async="" src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A1511133fb5da758ba967f97e052ab674f4dfebbfe01ecdc7b3d634756b753cb6&amp;width=100%25&amp;height=500&amp;lang=ru_RU&amp;scroll=true">
</script>
</div>


<script src="https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>
<script src="wp-content/scripts/partners.js"></script>

<script>
jQuery(document).ready(function() {
    var partners_line = jQuery("#partners");
    var footer        = jQuery("#footer");

    jQuery(window).scroll(function () {
        //console.log("p: " + partners_line.offset().top + " f: " + footer.offset().top);
        var offset_sum = partners_line.offset().top + parseInt(partners_line.css('bottom'), 10) + 45;

        if (offset_sum > footer.offset().top) {
            partners_line.css({'bottom': offset_sum - footer.offset().top + 'px'});
        } else {
            partners_line.css({'bottom': '0px'});
        }
    });
});
</script>
